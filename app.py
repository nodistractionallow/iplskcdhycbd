from flask import Flask, render_template, request, redirect, url_for
import json
import mainconnect # Import the game logic from mainconnect.py
import os

app = Flask(__name__)

# Load teams from teams/teams.json
def load_teams():
    try:
        with open('teams/teams.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Error: teams/teams.json not found. Please ensure the file exists.")
        return {} # Return empty dict or handle error as appropriate
    except json.JSONDecodeError:
        print("Error: Could not decode JSON from teams/teams.json.")
        return {}

# Ensure scores directory exists for mainconnect.py
dir_path = os.path.join(os.getcwd(), "scores")
os.makedirs(dir_path, exist_ok=True)
# Clean scores folder before starting (optional, based on doipl.py behavior)
for f_remove in os.listdir(dir_path):
    os.remove(os.path.join(dir_path, f_remove))

@app.route('/', methods=['GET'])
def index():
    teams_data = load_teams()
    return render_template('index.html', teams=teams_data, scorecard_data=None)

@app.route('/generate_scorecard', methods=['POST'])
def generate_scorecard():
    teams_data = load_teams()
    team1_code = request.form.get('team1')
    team2_code = request.form.get('team2')

    if not team1_code or not team2_code:
        # Handle error: team codes not provided
        return redirect(url_for('index')) # Or show an error message

    if team1_code == team2_code:
        # Handle error: same team selected
        return redirect(url_for('index')) # Or show an error message

    # Call the game simulation function from mainconnect.py
    # The 'game' function in mainconnect.py expects team codes (e.g., 'csk', 'mi')
    # and manual=False for programmatic execution.
    # It writes output to a file, but also returns a dictionary.
    match_results = mainconnect.game(manual=False, sentTeamOne=team1_code, sentTeamTwo=team2_code, switch="webapp")

    # Adapt the match_results to the structure expected by index.html
    # The mainconnect.game() returns:
    # {
    #     "innings1Batting": tabulated string, "innings1Bowling": tabulated string,
    #     "innings2Batting": tabulated string, "innings2Bowling": tabulated string,
    #     "innings2Balls": int, "innings1Balls": int (usually 120),
    #     "innings1Runs": int, "innings2Runs": int,
    #     "winMsg": str,
    #     "innings1Battracker": dict, "innings2Battracker": dict,
    #     "innings1Bowltracker": dict, "innings2Bowltracker": dict,
    #     "innings1BatTeam": str, "innings2BatTeam": str,
    #     "winner": str,
    #     "innings1Log": list, "innings2Log": list,
    #     "tossMsg": str
    # }
    # The template index.html expects a dictionary called scorecard_data with specific keys.

    def process_batting_innings(bat_tracker):
        wickets = 0
        for player, stats in bat_tracker.items():
            stats['how_out'] = "Not out" # Default
            if not stats['ballLog']: # Did not bat
                stats['how_out'] = "DNB"
                stats['runs'] = stats.get('runs', '') # Ensure 'runs' exists
                stats['balls'] = stats.get('balls', '') # Ensure 'balls' exists
                continue

            wicket_found = False
            for log_entry in stats['ballLog']:
                if "W:" in log_entry:
                    wickets += 1
                    wicket_found = True
                    parts = log_entry.split(':')[-1].split('-')
                    if 'CaughtBy' in parts:
                        try:
                            fielder_index = parts.index('CaughtBy') + 1
                            bowler_index = parts.index('Bowler') + 1
                            stats['how_out'] = f"c {parts[fielder_index]} b {parts[bowler_index]}"
                        except (ValueError, IndexError):
                            stats['how_out'] = "Caught" # Fallback
                    elif 'runout' in parts:
                        stats['how_out'] = "Run out"
                    elif len(parts) > 1 and parts[0] == 'W':
                         stats['how_out'] = f"{parts[1]} b {parts[parts.index('Bowler')+1]}"
                    else: # Should not happen if W is present
                        stats['how_out'] = "Wicket"
                    break # Process only the first wicket entry for how_out
            if not wicket_found and stats['balls'] == 0 and stats['runs'] == 0: # Check if DNB based on 0 balls, 0 runs if not out
                # This might need adjustment based on how mainconnect.py handles DNB players in ballLog
                is_dnb = True
                for p_stats in bat_tracker.values():
                    if p_stats['balls'] > 0: # If anyone batted, this player is DNB only if they have 0 balls
                        is_dnb = (stats['balls'] == 0)
                        break
                if is_dnb:
                    stats['how_out'] = "DNB"


        return bat_tracker, wickets

    innings1_battracker_processed, wickets1_fallen = process_batting_innings(match_results.get("innings1Battracker", {}))
    innings2_battracker_processed, wickets2_fallen = process_batting_innings(match_results.get("innings2Battracker", {}))

    scorecard_data_for_template = {
        "team1": team1_code,
        "team2": team2_code,
        "tossMsg": match_results.get("tossMsg"),
        "innings1BatTeam": match_results.get("innings1BatTeam"),
        "innings1Runs": match_results.get("innings1Runs"),
        "innings1Wickets": wickets1_fallen,
        "innings1Balls": match_results.get("innings1Balls", 0),
        "innings1Battracker": innings1_battracker_processed,
        "innings1Bowltracker": match_results.get("innings1Bowltracker"),
        "innings2BatTeam": match_results.get("innings2BatTeam"),
        "innings2Runs": match_results.get("innings2Runs"),
        "innings2Wickets": wickets2_fallen,
        "innings2Balls": match_results.get("innings2Balls", 0),
        "innings2Battracker": innings2_battracker_processed,
        "innings2Bowltracker": match_results.get("innings2Bowltracker"),
        "winMsg": match_results.get("winMsg"),
        "winner": match_results.get("winner"),
        "innings1Log": match_results.get("innings1Log"),
        "innings2Log": match_results.get("innings2Log")
    }

    return render_template('index.html', teams=teams_data, scorecard_data=scorecard_data_for_template)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
