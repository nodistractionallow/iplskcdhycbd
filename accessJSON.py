import json

with open("data/playerInfoProcessed.json") as f:
	data = json.load(f)

def getPlayerInfo(initials):
	# fetch = document.find_one({"playerInitials": initials})
	if initials not in data:
		print(f"Warning: Player initials '{initials}' not found in playerInfoProcessed.json.")
		return None
	fetch = data[initials] #may be same for some

	return fetch 