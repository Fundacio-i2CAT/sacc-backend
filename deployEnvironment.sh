#!/usr/bin/env bash

byobu new-session -d -s $USER
byobu rename-window -t $USER:0 'BACKEND+BLOCKCHAIN'
byobu send-keys "source venv/bin/activate" C-m
byobu send-keys "npx ganache-cli --mnemonic 'code super common cruise creek source police mistake fox twist brick ivory' -h 0.0.0.0 -g 0 -a 20" C-m
byobu split-window -v
byobu send-keys "node utils/deploy.js" C-m
byobu send-keys "node index.js" C-m

byobu new-window -t $USER:1 -n 'MOBILE-APP'
byobu send-keys "cd ../sacculus" C-m
byobu send-keys "deactivate && source venv/bin/activate" C-m
byobu send-keys "~/Android/Sdk/emulator/emulator -avd Pixel3" C-m
byobu split-window -v
byobu send-keys "cd ../sacculus" C-m
byobu send-keys "source venv/bin/activate && npm start" C-m
byobu split-window -v
byobu send-keys "adb kill-server; adb root" C-m
byobu send-keys "~/Android/Sdk/platform-tools/adb reverse tcp:3001 tcp:3001" C-m
byobu send-keys "cd ../sacculus" C-m
byobu send-keys "source venv/bin/activate && npm start" C-m
byobu send-keys "npx react-native run-android" C-m
