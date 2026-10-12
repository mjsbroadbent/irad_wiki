# Nano Banana MCP server for Claude (Windows)

Lets Claude generate and edit images with Google's Gemini image model ("Nano Banana")
from a chat, using your own API key. Images are saved to a folder on your PC.

## 1. Get a Gemini API key
Go to https://aistudio.google.com/apikey and create a key. Image generation may need
billing turned on for the key's Google Cloud project; check Google's pricing page for
the current cost per image.

## 2. Install the two Python packages
Use the real Python (`py`), not Inkscape's:

    py -m pip install "mcp>=1.2" pillow certifi

Then find the full path of that Python (you need it in step 4):

    py -c "import sys; print(sys.executable)"

## 3. Put the script somewhere permanent
For example `C:\Users\<you>\IradTools\nano_banana_mcp.py`.

## 4. Add it to the Claude desktop app
Claude desktop → Settings → Developer → Edit Config. That opens
`claude_desktop_config.json`. Add (or merge into) the `mcpServers` block, using your
own paths and key; backslashes must be doubled:

    {
      "mcpServers": {
        "nano-banana": {
          "command": "C:\\Users\\<you>\\AppData\\Local\\Programs\\Python\\Python313\\python.exe",
          "args": ["C:\\Users\\<you>\\IradTools\\nano_banana_mcp.py"],
          "env": {
            "GEMINI_API_KEY": "paste-your-key-here",
            "NANO_BANANA_OUT": "C:\\Users\\<you>\\IradTools\\generated"
          }
        }
      }
    }

Optional: `"NANO_BANANA_MODEL": "<model name>"` to use a different Gemini image model.

Save, then quit Claude completely (right-click the tray icon → Quit) and reopen it.
In a new chat, the tools menu should list **nano-banana** with three tools:
`generate_image`, `edit_image`, `list_images`.

## 5. Use it from a cloud chat
Open the chat in the Claude desktop app and choose "Link to this computer". Claude can
then call the tools, see a preview of each result, and retry or edit as needed.

The key stays in your config file on your PC; it is only sent to Google.
