import mainconnect
import sys
import io

# Capture stdout and stderr
old_stdout = sys.stdout
old_stderr = sys.stderr
sys.stdout = captured_stdout = io.StringIO()
sys.stderr = captured_stderr = io.StringIO()

game_completed_message = ""
key_error_message = ""
other_error_message = ""

try:
    mainconnect.game(manual=False, sentTeamOne="CSK", sentTeamTwo="MI", switch="testrun")
    game_completed_message = "Game function completed."
    print(game_completed_message) # Print here so it's captured
except KeyError as e:
    key_error_message = f"KeyError encountered: {e}"
    print(key_error_message) # Print here
except Exception as e:
    other_error_message = f"An unexpected error occurred: {e}"
    print(other_error_message) # Print here
finally:
    # Restore stdout and stderr
    sys.stdout = old_stdout
    sys.stderr = old_stderr

    stdout_val = captured_stdout.getvalue()
    stderr_val = captured_stderr.getvalue()

    print("STDOUT_CAPTURED_DURING_GAME_RUN:")
    print(stdout_val)
    print("STDERR_CAPTURED_DURING_GAME_RUN:")
    print(stderr_val)

    # The game itself writes to a file, so stdout_val might be empty or only have our messages.
    # We need to check our specific messages.

    if "KeyError encountered: 'NAME'" in stdout_val or "KeyError encountered: 'NAME'" in stderr_val:
        print("Test FAILED: KeyError for 'NAME' found.")
    elif key_error_message and "KeyError" in key_error_message: # Check the captured error message
        print(f"Test FAILED: {key_error_message}")
    elif game_completed_message in stdout_val:
        print("Test SUCCEEDED: Game function completed without critical KeyErrors.")
    elif other_error_message:
        print(f"Test FAILED: {other_error_message}")
    else:
        # This case might occur if the game prints something unexpected or exits early
        # without printing our success/failure messages to the captured stdout.
        print("Test FAILED: Game function did not complete as expected or an unhandled error occurred. Check game output file.")
