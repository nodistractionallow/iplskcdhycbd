document.addEventListener('DOMContentLoaded', () => {
    const teamCards = document.querySelectorAll('.team-card');
    const btnSimulateFull = document.getElementById('btn-simulate-full');
    const btnSimulateBallByBall = document.getElementById('btn-simulate-ball-by-ball');
    const teamSelectionGrid = document.querySelector('.team-selection-grid');
    const simulationButtons = document.querySelector('.simulation-buttons');

    // Toss section elements
    const tossSectionContainer = document.getElementById('toss-section-container');
    const tossCoinVisual = document.getElementById('toss-coin-visual');
    const tossCallText = document.getElementById('toss-call-text');
    const tossOutcomeText = document.getElementById('toss-outcome-text');
    const tossMessageDisplay = document.getElementById('toss-message-display');
    const btnProceedToInnings = document.getElementById('btn-proceed-to-innings');

    // LED display section
    const ledDisplaySection = document.getElementById('led-display-section');
    const ledBallOutcome = document.getElementById('led-ball-outcome');
    const ledBallInfo = document.getElementById('led-ball-info');
    const ledOnStrikeBatsman = document.getElementById('led-on-strike-batsman');
    const ledNonStrikeBatsman = document.getElementById('led-non-strike-batsman');
    const ledCurrentBowler = document.getElementById('led-current-bowler');
    const ledCurrentScore = document.getElementById('led-current-score');
    const ledInnings2ChaseInfo = document.getElementById('led-innings2-chase-info');
    const ledTargetScore = document.getElementById('led-target-score');
    const ledRunsNeeded = document.getElementById('led-runs-needed');
    const ledBallsRemaining = document.getElementById('led-balls-remaining');
    const ledMatchEndMessage = document.getElementById('led-match-end-message');

    // LED Controls
    const speedSlider = document.getElementById('speed-slider');
    const speedValueDisplay = document.getElementById('speed-value');
    const btnPlay = document.getElementById('btn-play');
    const btnPause = document.getElementById('btn-pause');

    let selectedTeams = [];
    const originalCardBackgrounds = new Map();
    let currentMatchData = null; // To store data from /api/start_simulation

    // Simulation State
    let simState = {
        currentInnings: 1,
        currentBallIndex: 0,
        simulationSpeed: 1500, // Default speed
        isPaused: true,
        timeoutId: null,
        activeInningsLog: null,
        batsmanOnStrike: null,
        batsmanNonStrike: null
    };

    // Store original background colors for mouseout
    teamCards.forEach(card => {
        originalCardBackgrounds.set(card, window.getComputedStyle(card).backgroundColor);
    });

    const updateButtonStates = () => {
        if (selectedTeams.length === 2) {
            btnSimulateFull.disabled = false;
            btnSimulateBallByBall.disabled = false;
        } else {
            btnSimulateFull.disabled = true;
            btnSimulateBallByBall.disabled = true;
        }
    };

    teamCards.forEach(card => {
        const primaryColor = card.dataset.primaryColor;

        card.addEventListener('mouseover', () => {
            if (!card.classList.contains('team-card-selected')) { // Don't change background if selected, border is enough
                card.style.backgroundColor = primaryColor;
            }
        });

        card.addEventListener('mouseout', () => {
            if (!card.classList.contains('team-card-selected')) {
                 card.style.backgroundColor = originalCardBackgrounds.get(card);
            }
        });

        card.addEventListener('click', () => {
            const teamCode = card.dataset.teamCode;
            const isSelected = card.classList.contains('team-card-selected');

            if (isSelected) {
                selectedTeams = selectedTeams.filter(code => code !== teamCode);
                card.classList.remove('team-card-selected');
                card.style.backgroundColor = originalCardBackgrounds.get(card); // Reset background on de-selection
            } else {
                if (selectedTeams.length < 2) {
                    selectedTeams.push(teamCode);
                    card.classList.add('team-card-selected');
                    // Optional: keep primary color as background when selected, or use CSS for it
                    // card.style.backgroundColor = primaryColor;
                } else {
                    // Optional: Provide feedback that max teams are selected
                    console.log("Maximum of 2 teams already selected.");
                }
            }
            updateButtonStates();
        });
    });

    // Initial button state update
    updateButtonStates();

    // Event Listener for "Simulate Ball by Ball" button
    btnSimulateBallByBall.addEventListener('click', async () => {
        if (selectedTeams.length !== 2) {
            alert("Please select exactly two teams.");
            return;
        }
        console.log(`[API Call] Starting simulation for teams: ${selectedTeams[0]} vs ${selectedTeams[1]}`);
        try {
            const response = await fetch('/api/start_simulation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ team1: selectedTeams[0], team2: selectedTeams[1] }),
            });
            console.log("[API Call] Raw response object:", response);

            if (!response.ok) {
                let errorData = { error: `HTTP error! status: ${response.status}` };
                try {
                    errorData = await response.json();
                    console.error("[API Call] Error data from response:", errorData);
                } catch (e) {
                    console.error("[API Call] Could not parse error JSON from response", e);
                }
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            currentMatchData = await response.json();
            console.log("[API Call] Parsed currentMatchData:", currentMatchData);

            // Hide team selection and simulation buttons
            if(teamSelectionGrid) teamSelectionGrid.classList.add('hidden');
            if(simulationButtons) simulationButtons.classList.add('hidden');

            // Show toss section
            if(tossSectionContainer) tossSectionContainer.classList.remove('hidden');
            if(btnProceedToInnings) btnProceedToInnings.classList.add('hidden'); // Keep hidden initially

            // Reset toss animation texts
            if(tossCoinVisual) tossCoinVisual.textContent = 'Flipping the coin...';
            if(tossCallText) tossCallText.textContent = '';
            if(tossOutcomeText) tossOutcomeText.textContent = '';
            if(tossMessageDisplay) tossMessageDisplay.textContent = '';


            // Simulate toss animation
            setTimeout(() => {
                if(tossCoinVisual) tossCoinVisual.textContent = 'Coin is in the air!';
                // Simple random call for demo
                const callingTeam = Math.random() < 0.5 ? selectedTeams[0] : selectedTeams[1];
                const call = Math.random() < 0.5 ? "Heads" : "Tails";
                if(tossCallText) tossCallText.textContent = `${callingTeam.toUpperCase()} calls ${call}!`;
            }, 1000); // 1 second delay

            setTimeout(() => {
                const outcome = Math.random() < 0.5 ? "Heads" : "Tails";
                if(tossOutcomeText) tossOutcomeText.textContent = `It's ${outcome}!`;
            }, 2500); // 2.5 seconds delay

            setTimeout(() => {
                if(tossMessageDisplay && currentMatchData.tossMsg) {
                    tossMessageDisplay.textContent = currentMatchData.tossMsg;
                }
                if(tossCoinVisual) tossCoinVisual.textContent = 'Toss Complete!'; // Update visual
                if(tossCallText) tossCallText.textContent = ''; // Clear call text
                if(tossOutcomeText) tossOutcomeText.textContent = ''; // Clear outcome text
                if(btnProceedToInnings) btnProceedToInnings.classList.remove('hidden');
            }, 4000); // 4 seconds delay

        } catch (error) {
            console.error('[API Call] Error in fetch /api/start_simulation:', error);
            alert(`Error starting simulation: ${error.message}`);
        }
    });

    // Event Listener for "Simulate Full Match" button
    if (btnSimulateFull) {
        btnSimulateFull.addEventListener('click', () => {
            if (selectedTeams.length !== 2) {
                alert("Please select exactly two teams to simulate a full match.");
                return;
            }

            // Create a temporary form
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/generate_scorecard';

            // Create hidden input for team1
            const inputTeam1 = document.createElement('input');
            inputTeam1.type = 'hidden';
            inputTeam1.name = 'team1';
            inputTeam1.value = selectedTeams[0];
            form.appendChild(inputTeam1);

            // Create hidden input for team2
            const inputTeam2 = document.createElement('input');
            inputTeam2.type = 'hidden';
            inputTeam2.name = 'team2';
            inputTeam2.value = selectedTeams[1];
            form.appendChild(inputTeam2);

            // Append form to body, submit, and then remove
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form); // Optional: remove after submit
        });
    }

    // Event Listener for "Proceed to Innings" button
    if (btnProceedToInnings) {
        btnProceedToInnings.addEventListener('click', () => {
            if(tossSectionContainer) tossSectionContainer.classList.add('hidden');
            if(ledDisplaySection) ledDisplaySection.classList.remove('hidden');

            initializeLedDisplay();
            if(btnPlay) btnPlay.disabled = false;
            if(btnPause) btnPause.disabled = true;
            simState.isPaused = true; // Start paused, user clicks play
        });
    }

    function initializeLedDisplay() {
        console.log("[Initialize LED] Called. currentMatchData:", currentMatchData);
        simState.isPaused = true; // Should start paused
        simState.currentBallIndex = 0;
        if(simState.timeoutId) clearTimeout(simState.timeoutId);

        if (!currentMatchData) {
            console.error("[Initialize LED] currentMatchData is null or undefined. Cannot initialize display.");
            return;
        }

        try {
            const firstBallInnings = simState.currentInnings === 1 ? currentMatchData.innings1Log[0] : currentMatchData.innings2Log[0];
            if (!firstBallInnings) {
                console.error("[Initialize LED] First ball of innings is undefined. Innings Log:", simState.currentInnings === 1 ? currentMatchData.innings1Log : currentMatchData.innings2Log);
                // Set to defaults or handle as error
                simState.batsmanOnStrike = "N/A";
                simState.batsmanNonStrike = "N/A";
            } else {
                simState.batsmanOnStrike = firstBallInnings.batsman; // Initial on-strike batsman from log
                // Determine initial non-striker: if batsman is batter1, non-striker is batter2, else batter1
                simState.batsmanNonStrike = firstBallInnings.batsman === firstBallInnings.batter1 ? firstBallInnings.batter2 : firstBallInnings.batter1;
            }
        } catch (e) {
            console.error("[Initialize LED] Error accessing first ball data or batsmen:", e, "Innings Data:", simState.currentInnings === 1 ? currentMatchData.innings1Log : currentMatchData.innings2Log);
            simState.batsmanOnStrike = "Error";
            simState.batsmanNonStrike = "Error";
        }
        console.log(`[Initialize LED] Initial Batsmen: OnStrike: ${simState.batsmanOnStrike}, NonStrike: ${simState.batsmanNonStrike}`);


        if (simState.currentInnings === 1) {
            simState.activeInningsLog = currentMatchData.innings1Log;
            console.log("[Initialize LED] Set activeInningsLog for Innings 1:", simState.activeInningsLog);
            try {
                if(ledCurrentScore) ledCurrentScore.textContent = `0/0 (${currentMatchData.innings1BatTeam.toUpperCase()})`;
                if(ledInnings2ChaseInfo) ledInnings2ChaseInfo.classList.add('hidden');
                if(ledMatchEndMessage) ledMatchEndMessage.classList.add('hidden');
            } catch (e) {
                console.error("[Initialize LED] Error setting up DOM for Innings 1:", e);
            }
        } else { // Innings 2
            simState.activeInningsLog = currentMatchData.innings2Log;
            console.log("[Initialize LED] Set activeInningsLog for Innings 2:", simState.activeInningsLog);
            try {
                if(ledCurrentScore) ledCurrentScore.textContent = `0/0 (${currentMatchData.innings2BatTeam.toUpperCase()})`;
                const target = currentMatchData.innings1Runs + 1;
                if(ledTargetScore) ledTargetScore.textContent = target;
                if(ledInnings2ChaseInfo) ledInnings2ChaseInfo.classList.remove('hidden');
                if(ledMatchEndMessage) ledMatchEndMessage.classList.add('hidden');
            } catch (e) {
                console.error("[Initialize LED] Error setting up DOM for Innings 2:", e);
            }
        }

        try {
            if(ledBallOutcome) {
                ledBallOutcome.textContent = "▶"; // Play symbol or 0
                ledBallOutcome.className = 'led-ball-outcome outcome-default'; // Reset class
            }
            if(simState.activeInningsLog && simState.activeInningsLog.length > 0) {
                 updateDisplayForBall(simState.activeInningsLog[0], true); // Display first ball info without "playing" it
            } else {
                console.warn("[Initialize LED] Active innings log is empty or null. Displaying default LED info.");
                if(ledBallInfo) ledBallInfo.textContent = "Over: 0.0";
                if(ledOnStrikeBatsman) ledOnStrikeBatsman.textContent = "-";
                if(ledNonStrikeBatsman) ledNonStrikeBatsman.textContent = "-";
                if(ledCurrentBowler) ledCurrentBowler.textContent = "-";
            }
        } catch (e) {
            console.error("[Initialize LED] Error in final display setup or calling updateDisplayForBall:", e);
        }
        updatePlayPauseButtons();
    }

    // Regex to capture: Over.Ball, Bowler, Batsman, and the specific outcome part of the event string.
    // Example: "0.1 PlayerA to PlayerB 1 Score: 1/0" -> Outcome part is "1"
    // Example: "0.2 PlayerA to PlayerB W Wide Score: 1/0" -> Outcome part is "W Wide"
    // Example: "0.3 PlayerA to PlayerB W-CaughtBy-PlayerC-Bowler-PlayerA Score: 1/1" -> Outcome part is "W-CaughtBy-PlayerC-Bowler-PlayerA"
    const outcomeRegex = /^(\d+\.\d+)\s+(.+?)\s+to\s+(.+?)\s+(.+?)\s+Score:\s*(\d+\/\d+)/;

    function extractBallOutcome(eventString) {
        console.log("[Extract Ball] Event string:", eventString);
        const match = eventString.match(outcomeRegex);
        console.log("[Extract Ball] Regex match result:", match);
        if (!match) {
            console.warn("[Extract Ball] Could not parse event string with regex:", eventString);
            // Fallback for unparsed or simple log entries like "End of Over"
            if (eventString.toLowerCase().includes("end of over")) return { outcomeText: "End of Over", overBallStr: "", isWicket: false, isExtra: false, runs: 0, bowler: "", batsman: "" };
            return { outcomeText: eventString.substring(0,15), overBallStr: "", isWicket: false, isExtra: false, runs: 0, bowler: "", batsman: "" }; // Show part of string
        }

        const overBallStr = match[1];
        const bowlerName = match[2];
        const batsmanName = match[3];
        let outcomeDetails = match[4].trim(); // This is the part like "1", "W Wide", "W-CaughtBy-..."

        let displayOutcome = "";
        let isWicket = false;
        let isExtra = false;
        let runsScored = 0;

        if (outcomeDetails.startsWith("W-") || outcomeDetails === "W") {
            displayOutcome = "W";
            isWicket = true;
        } else if (outcomeDetails.includes("Wide")) {
            displayOutcome = "WD";
            isExtra = true;
            runsScored = parseInt(outcomeDetails.replace("Wide","").trim()) || 1; // WD usually 1 run
        } else if (outcomeDetails.includes("Noball")) {
            displayOutcome = "NB";
            isExtra = true;
            runsScored = parseInt(outcomeDetails.replace("Noball","").trim()) || 1; // NB run + actual run
        } else if (outcomeDetails.match(/^\d+$/)) { // Just a number (runs)
            displayOutcome = outcomeDetails;
            runsScored = parseInt(outcomeDetails);
        } else { // Fallback for complex outcomes not fully parsed for displayOutcome yet (e.g. "1 Noball")
            displayOutcome = outcomeDetails.split(" ")[0]; // Take the first part (e.g., "1" from "1 Noball")
            if (outcomeDetails.includes("Noball")) isExtra = true;
            if (outcomeDetails.includes("Wide")) isExtra = true; // Should be caught earlier
            // Try to parse runs if possible
            const runMatch = outcomeDetails.match(/\d+/);
            if (runMatch) runsScored = parseInt(runMatch[0]);
        }

        return {
            outcomeText: displayOutcome,
            overBallStr: overBallStr,
            isWicket: isWicket,
            isExtra: isExtra,
            runs: runsScored, // This is runs from this ball, not total score
            bowler: bowlerName,
            batsman: batsmanName
        };
    }

    function updateDisplayForBall(ballLogEntry, isInitial = false) {
        console.log("[Update Display] ballLogEntry:", ballLogEntry, "isInitial:", isInitial);
        if (!ballLogEntry || !ballLogEntry.event) {
            console.warn("[Update Display] Invalid ballLogEntry or event in ballLogEntry:", ballLogEntry);
            return;
        }

        const parsedInfo = extractBallOutcome(ballLogEntry.event);
        console.log("[Update Display] parsedInfo from extractBallOutcome:", parsedInfo);

        try {
            if(ledBallInfo) ledBallInfo.textContent = `Over: ${parsedInfo.overBallStr}`;
            if(ledBallOutcome) {
                ledBallOutcome.textContent = parsedInfo.outcomeText;
                ledBallOutcome.className = 'led-ball-outcome '; // Reset classes
                if (parsedInfo.isWicket) {
                    ledBallOutcome.classList.add('outcome-wicket');
                } else if (parsedInfo.outcomeText === "WD" || parsedInfo.outcomeText === "NB" || parsedInfo.isExtra) {
                    ledBallOutcome.classList.add('outcome-extra');
                } else if (parsedInfo.outcomeText === "0") {
                    ledBallOutcome.classList.add('outcome-runs-0');
                } else if (["4", "5", "6"].includes(parsedInfo.outcomeText)) {
                    ledBallOutcome.classList.add('outcome-runs-456');
                } else if (["1", "2", "3"].includes(parsedInfo.outcomeText)) {
                    ledBallOutcome.classList.add('outcome-runs-123');
                } else {
                    ledBallOutcome.classList.add('outcome-default');
                }
            }
        } catch (e) {
            console.error("[Update Display] Error updating LED ball outcome/info:", e);
        }

        // Update batsman on strike and non-striker
        simState.batsmanOnStrike = parsedInfo.batsman; // Batsman who faced the ball
        console.log(`[Update Display] Batsman on strike (from parsedInfo): ${simState.batsmanOnStrike}`);
        console.log(`[Update Display] About to determine non-striker. ballLogEntry.batter1: ${ballLogEntry.batter1}, ballLogEntry.batter2: ${ballLogEntry.batter2}`);
        if (ballLogEntry.batter1 && ballLogEntry.batter2) {
             simState.batsmanNonStrike = (parsedInfo.batsman === ballLogEntry.batter1) ? ballLogEntry.batter2 : ballLogEntry.batter1;
        } else {
            console.warn("[Update Display] batter1 or batter2 is missing in ballLogEntry. Non-striker may be incorrect.");
            // Attempt to find non-striker from previous state if this is not the first ball, or set to a default
             simState.batsmanNonStrike = simState.batsmanNonStrike || "N/A"; // Keep existing if available
        }
        console.log(`[Update Display] Batsman non-strike: ${simState.batsmanNonStrike}`);

        try {
            if(ledOnStrikeBatsman) ledOnStrikeBatsman.textContent = simState.batsmanOnStrike;
            if(ledNonStrikeBatsman) ledNonStrikeBatsman.textContent = simState.batsmanNonStrike;
            if(ledCurrentBowler) ledCurrentBowler.textContent = parsedInfo.bowler;

            // Score from ballLogEntry reflects total score *after* this ball
            if(ledCurrentScore) {
                const teamCode = simState.currentInnings === 1 ? currentMatchData.innings1BatTeam.toUpperCase() : currentMatchData.innings2BatTeam.toUpperCase();
                ledCurrentScore.textContent = `${ballLogEntry.runs}/${ballLogEntry.wickets} (${teamCode})`;
            }
        } catch (e) {
            console.error("[Update Display] Error updating batsmen/bowler/score DOM elements:", e);
        }

        if (simState.currentInnings === 2) {
            try {
                const target = currentMatchData.innings1Runs + 1;
                const runsNeeded = target - ballLogEntry.runs;
                const ballsRemaining = 120 - ballLogEntry.balls; // Assuming 20 overs
                if(ledTargetScore) ledTargetScore.textContent = target;
                if(ledRunsNeeded) ledRunsNeeded.textContent = runsNeeded > 0 ? runsNeeded : 0;
                if(ledBallsRemaining) ledBallsRemaining.textContent = ballsRemaining;
                if(ledInnings2ChaseInfo) ledInnings2ChaseInfo.classList.remove('hidden');

                if (runsNeeded <= 0 && ballLogEntry.runs >= 0) { // Target achieved (runs can be 0 if wickets fell on target score)
                     if(ledMatchEndMessage && currentMatchData.winMsg) {
                        ledMatchEndMessage.textContent = currentMatchData.winMsg;
                        ledMatchEndMessage.classList.remove('hidden');
                    } else if (ledMatchEndMessage) {
                        ledMatchEndMessage.textContent = "Target Achieved!"; // Fallback message
                        ledMatchEndMessage.classList.remove('hidden');
                    }
                    console.log("[Update Display] Target achieved in Innings 2.");
                    simState.isPaused = true;
                    clearTimeout(simState.timeoutId);
                    updatePlayPauseButtons();
                }
            } catch (e) {
                console.error("[Update Display] Error updating Innings 2 chase info:", e);
            }
        }
         // Batsmen swap logic for next ball (simplified: after 1, 3, 5 runs, or end of over)
        // This is complex because extractBallOutcome gives runs for *this* ball.
                }
                simState.isPaused = true;
                clearTimeout(simState.timeoutId);
                updatePlayPauseButtons();
            }
        }
         // Batsmen swap logic for next ball (simplified: after 1, 3, 5 runs, or end of over)
        // This is complex because extractBallOutcome gives runs for *this* ball.
        // We need to know if an odd run was scored OR if it's end of over (next ball will be .1)
        // For now, this is handled by the log data itself which should have correct batsman for next ball.
        // The main change is updating simState.batsmanOnStrike and simState.batsmanNonStrike for the *next* ball display.
        // This is implicitly handled if the next ball's log entry has the correct batsman.
        // However, if it's end of over, they also swap (unless it was a single on last ball).
        // This logic is tricky and might require more state from mainconnect.py if not already in log.
        // For now, we rely on the log providing the correct batsman for each ball.
    }

    function playNextBall() {
        if (simState.isPaused) return;
        if (!simState.activeInningsLog) {
            console.error("[Play Next Ball] No active innings log! Halting playback.");
            simState.isPaused = true;
            updatePlayPauseButtons();
            return;
        }

        console.log(`[Play Next Ball] Current Index: ${simState.currentBallIndex}, Log Length: ${simState.activeInningsLog.length}`);

        if (simState.currentBallIndex >= simState.activeInningsLog.length) {
            if (simState.currentInnings === 1) {
                console.log("[Play Next Ball] End of Innings 1. Switching to Innings 2.");
                simState.currentInnings = 2;
                simState.currentBallIndex = 0;
                try {
                    if(ledBallOutcome) {
                        ledBallOutcome.textContent = "Innings Break";
                        ledBallOutcome.className = 'led-ball-outcome outcome-innings-break';
                    }
                    // Update batsmen for start of 2nd innings
                    if (currentMatchData && currentMatchData.innings2Log && currentMatchData.innings2Log.length > 0) {
                        const firstBallSecondInnings = currentMatchData.innings2Log[0];
                        if (firstBallSecondInnings) {
                            simState.batsmanOnStrike = firstBallSecondInnings.batsman;
                            simState.batsmanNonStrike = firstBallSecondInnings.batsman === firstBallSecondInnings.batter1 ? firstBallSecondInnings.batter2 : firstBallSecondInnings.batter1;
                             console.log(`[Play Next Ball] Set batsmen for Innings 2: OnStrike: ${simState.batsmanOnStrike}, NonStrike: ${simState.batsmanNonStrike}`);
                        } else {
                            console.warn("[Play Next Ball] First ball of Innings 2 log is undefined.");
                        }
                    } else {
                        console.warn("[Play Next Ball] Innings 2 log is missing or empty. Cannot set initial batsmen for Innings 2.");
                    }
                } catch (e) {
                    console.error("[Play Next Ball] Error during Innings 1 to 2 transition:", e);
                }


                simState.timeoutId = setTimeout(() => {
                    initializeLedDisplay(); // Sets up for 2nd innings
                    if (!simState.isPaused) simState.timeoutId = setTimeout(playNextBall, simState.simulationSpeed);
                }, 3000); // 3s break
                return;
            } else { // Match ended
                console.log("[Play Next Ball] End of Match.");
                try {
                    if(ledMatchEndMessage && currentMatchData && currentMatchData.winMsg) {
                        ledMatchEndMessage.textContent = currentMatchData.winMsg;
                        ledMatchEndMessage.classList.remove('hidden');
                    } else if (ledBallOutcome) {
                         ledBallOutcome.textContent = "Match End";
                    } else if (ledMatchEndMessage) {
                        ledMatchEndMessage.textContent = "Match Ended";
                        ledMatchEndMessage.classList.remove('hidden');
                    }
                } catch (e) {
                    console.error("[Play Next Ball] Error displaying match end message:", e);
                }
                simState.isPaused = true;
                updatePlayPauseButtons();
                return;
            }
        }

        const currentEvent = simState.activeInningsLog[simState.currentBallIndex];
        console.log(`[Play Next Ball] Processing event for ball ${simState.currentBallIndex}:`, currentEvent);
        try {
            updateDisplayForBall(currentEvent);
        } catch (e) {
            console.error(`[Play Next Ball] Error updating display for ball ${simState.currentBallIndex}:`, e, "Event:", currentEvent);
            simState.isPaused = true; // Pause on error to prevent spamming
            updatePlayPauseButtons();
            return;
        }


        // Batsman rotation for *next* ball (simplified)
        // The log itself should dictate who faces the next ball by having `ballData.batsman`
        // This section might need to update simState.batsmanOnStrike and simState.batsmanNonStrike for the *next* iteration.
        // For now, parsedInfo.batsman from the *current* ball updates the on-strike display.
        // The next ball's data will provide the correct on-strike batsman.
        // End of over strike changes are implicitly handled if the log is correct.

        simState.currentBallIndex++;
        simState.timeoutId = setTimeout(playNextBall, simState.simulationSpeed);
    }

    function updatePlayPauseButtons() {
        if(btnPlay) btnPlay.disabled = !simState.isPaused;
        if(btnPause) btnPause.disabled = simState.isPaused;
    }

    if(speedSlider) {
        speedSlider.addEventListener('input', function() {
            simState.simulationSpeed = parseInt(this.value);
            if(speedValueDisplay) speedValueDisplay.textContent = (this.value / 1000).toFixed(1) + 's';
        });
        // Set initial display
        if(speedValueDisplay) speedValueDisplay.textContent = (simState.simulationSpeed / 1000).toFixed(1) + 's';
    }

    if(btnPlay) {
        btnPlay.addEventListener('click', () => {
            simState.isPaused = false;
            updatePlayPauseButtons();
            playNextBall();
        });
    }

    if(btnPause) {
        btnPause.addEventListener('click', () => {
            simState.isPaused = true;
            updatePlayPauseButtons();
            clearTimeout(simState.timeoutId);
        });
    }
});
