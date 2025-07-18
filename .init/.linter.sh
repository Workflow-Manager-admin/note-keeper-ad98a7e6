#!/bin/bash
cd /home/kavia/workspace/code-generation/note-keeper-ad98a7e6/notes_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

