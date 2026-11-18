# Success Beyond Money & Fame

A local, eight-slide English presentation built as a website. It includes a 5–7 minute speaker script, a countdown timer, keyboard navigation, an overview screen, and locally stored images.

## Open it

Double-click `index.html` in File Explorer. The site works without a server or internet connection.

If your browser restricts local files, open PowerShell in this folder and run:

```powershell
node server.js
```

Then visit <http://localhost:4173>.

## Present it

- `→` / `←`: next or previous slide
- Scroll down / up: travel to the next or previous floor of the tower
- `N`: open or close the speaker notes
- `O`: open the slide overview
- `F` or `P`: enter or exit presentation mode and start the timer
- `T`: pause or resume the six-minute timer
- `Home` / `End`: jump to the first or last slide

The speaker notes are built into the site. Together, they run for roughly six minutes at a comfortable speaking pace.

Each slide is presented as a floor of the “success tower.” Going forward descends through perspective floor rings and cloud bands; going backward climbs through the same space in reverse. The small elevator marker beside the navigation dots tracks the current level.

## Make it yours

Edit `index.html` to personalize the personal-definition slide and speaker notes in each slide's `data-notes` attribute. Keep the visual copy short and keep the details in the notes.

All photographs are stored in `assets/images/`. Credit and research links are available from the final slide and in the site's **Sources & image credits** dialog.
