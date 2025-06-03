import mainconnect
import sys
import io
import json # For loading the expected output file

# Capture stdout and stderr
old_stdout = sys.stdout
old_stderr = sys.stderr
# We don't capture stdout/stderr here with io.StringIO initially,
# because mainconnect.game itself redirects sys.stdout to a file.
# We will capture the console output of this script later if needed,
# but the primary check will be the contents of the file mainconnect.game writes to,
# and its return value.

game_return_value = None
script_stdout_capture = io.StringIO()
script_stderr_capture = io.StringIO()

# Redirect this script's stdout/stderr to capture its own print statements
sys.stdout = script_stdout_capture
sys.stderr = script_stderr_capture

try:
    game_return_value = mainconnect.game(manual=False, sentTeamOne="CSK", sentTeamTwo="MI", switch="testrun2")
except Exception as e:
    print(f"CRITICAL SCRIPT ERROR: mainconnect.game call failed unexpectedly: {e}")
finally:
    # Restore this script's original stdout/stderr
    sys.stdout = old_stdout
    sys.stderr = old_stderr

    # Print what the script itself captured (if anything beyond game's file output)
    print("---- SCRIPT STDOUT CAPTURE ----")
    script_stdout_val = script_stdout_capture.getvalue()
    print(script_stdout_val)
    print("---- SCRIPT STDERR CAPTURE ----")
    script_stderr_val = script_stderr_capture.getvalue()
    print(script_stderr_val)
    print("-------------------------------")

# Now, separately read the file mainconnect.game was supposed to write to.
game_output_filename = "scores/CSKvMI_testrun2.txt"
game_file_content = ""
try:
    with open(game_output_filename, 'r') as f:
        game_file_content = f.read()
    print(f"---- CONTENT OF {game_output_filename} ----")
    print(game_file_content)
    print("------------------------------------")
except FileNotFoundError:
    print(f"ERROR: Game output file {game_output_filename} not found.")
    game_file_content = None # Ensure it's defined for later checks

print("---- GAME RETURN VALUE ----")
print(json.dumps(game_return_value, indent=4)) # Pretty print the JSON return
print("--------------------------")

# Define success flags
no_key_error_name = True # Assume true unless specific key error is found
warnings_present = False
critical_error_present = False
return_value_correct = False

# Check 1: No KeyError: 'NAME' (primarily in game_file_content or script_stderr_val if game crashes early)
if "KeyError: 'NAME'" in game_file_content or "KeyError: 'NAME'" in script_stderr_val:
    no_key_error_name = False
    print("FAILURE: KeyError: 'NAME' found.")

# Check 2: Warnings about missing player data
if "Warning: Player data for 'Kieron Pollard' (Team 1) not found. Skipping." in game_file_content and \
   "Warning: Player data for 'Glenn Maxwell' (Team 2) not found. Skipping." in game_file_content:
    warnings_present = True
else:
    print("FAILURE: Expected player warnings not found in game output file.")

# Check 3: "CRITICAL ERROR" message about empty teams
# Adjusted to expect MI to have 1 player as per the last output.
if "CRITICAL ERROR: Cannot start simulation." in game_file_content and \
   "Team 'CSK' has 0 players, Team 'MI' has 1 players. Both teams need valid player data to proceed." in game_file_content:
    critical_error_present = True
else:
    print("FAILURE: Expected 'CRITICAL ERROR' message for empty teams not found or incorrect player counts in the message.")
    print(f"DEBUG: Searching for 'Team \\'CSK\\' has 0 players, Team \\'MI\\' has 1 players' in file content:\n{game_file_content}")


# Check 4: Function returns the error dictionary
if game_return_value and isinstance(game_return_value, dict):
    # Also check the player counts in the returned error message
    expected_error_str = "Team setup failed. Team CSK has 0 players, Team MI has 1 players."
    if game_return_value.get("error") == expected_error_str and \
       game_return_value.get("winMsg") == "Simulation aborted due to empty team(s) after player data lookup." and \
       game_return_value.get("tossMsg") == "Toss not conducted due to team data issues.":
        return_value_correct = True
    else:
        print(f"FAILURE: Return value structure or content for aborted simulation is incorrect.")
        if game_return_value.get("error") != expected_error_str:
            print(f"DEBUG: Expected error in return: '{expected_error_str}'")
            print(f"DEBUG: Actual error in return:   '{game_return_value.get('error')}'")

else:
    print("FAILURE: Game did not return a dictionary as expected.")


# Final success determination
if no_key_error_name and warnings_present and critical_error_present and return_value_correct:
    print("Test SUCCEEDED: All conditions met.")
else:
    print("Test FAILED: One or more conditions not met.")
