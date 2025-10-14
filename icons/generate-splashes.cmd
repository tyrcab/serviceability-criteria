@echo off
REM Windows CMD script to generate iOS PWA splash screens using ImageMagick

SET INPUT_ICON=icon-512.png
SET OUTPUT_DIR=icons
SET BG_COLOR=#1E90FF

REM Create output folder if it doesn't exist
IF NOT EXIST "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

REM Generate splash images
magick convert "%INPUT_ICON%" -background "%BG_COLOR%" -gravity center -extent 1125x2436 "%OUTPUT_DIR%\splash-1125x2436.png"
magick convert "%INPUT_ICON%" -background "%BG_COLOR%" -gravity center -extent 1242x2208 "%OUTPUT_DIR%\splash-1242x2208.png"
magick convert "%INPUT_ICON%" -background "%BG_COLOR%" -gravity center -extent 750x1334 "%OUTPUT_DIR%\splash-750x1334.png"
magick convert "%INPUT_ICON%" -background "%BG_COLOR%" -gravity center -extent 640x1136 "%OUTPUT_DIR%\splash-640x1136.png"
magick convert "%INPUT_ICON%" -background "%BG_COLOR%" -gravity center -extent 1536x2048 "%OUTPUT_DIR%\splash-1536x2048.png"
magick convert "%INPUT_ICON%" -background "%BG_COLOR%" -gravity center -extent 1668x2224 "%OUTPUT_DIR%\splash-1668x2224.png"
magick convert "%INPUT_ICON%" -background "%BG_COLOR%" -gravity center -extent 1668x2388 "%OUTPUT_DIR%\splash-1668x2388.png"
magick convert "%INPUT_ICON%" -background "%BG_COLOR%" -gravity center -extent 2048x2732 "%OUTPUT_DIR%\splash-2048x2732.png"

echo All splash screens generated in %OUTPUT_DIR%\
pause
