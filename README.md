# Wanaka · Plan mode · 1026

The front end for plan mode, from the idea box on the home page to the plan
arriving on a handheld and the paw taking the approved plan away.

    npm start        # or: python3 serve.py   →  http://localhost:8468

    ?go=console      skip the home page and the chat, straight to the plan console
    ?view=plan       the same, for looking at the finished plan

## The run

1. **Home** — you type an idea. **Plan mode** sits in the idea box, on by default.
2. **Studio** — the message lands in the chat, Wana thinks, and the team works
   through four steps in a Deep Thinking card.
3. **The plan** — it arrives as a card in the chat and opens by itself; the card's
   View full plan button opens it again. The 10/26 console: a paw pushes the shut
   console up and it opens like a book. Plan: the cover is there; Regenerate cover
   generates a new one (with a failed → Try Again state). Assets: four categories on the
   left, a searchable grid on the right; Next walks the categories, anything not picked
   is Picked by AI, and the last category's button is Start Building.
4. **Approve** — the cover shuts, a keychain is hung on, it turns twice and the paw takes
   it away. The run ends there.

## Layout

    index.html          the shell: sidebar, home screen, studio screen
    css/tokens.css      the values the screens are built from
    css/app.css         shell + sidebar
    css/home.css        hero, idea box, plan button, trending
    css/studio.css      build canvas + the chat panel
    css/console.css     the plan console
    js/data.js          trending games, the plan, the steps  ← swap for an API
    js/home.js          the idea box
    js/studio.js        the chat, and the scripted run        ← swap `script()` for a stream
    js/scene.js         the room the crew builds, drawn in code
    js/console.js       the console (mount / replay / unmount)
    js/app.js           home → studio → console

## Where the real thing plugs in

* `js/data.js` holds every piece of content. A real endpoint returns the same shapes.
* `js/studio.js` → `script()` fakes the team working. Replace it with the stream;
  the messages and the task list are already components.
* The console tells the app it is done with a `e-approved` event on `document`.

## Built from

Figma · Wanaka Studio — `home page` (48075:33470), the Studio (48075:32660), and the
plan console from frame `10/26` (49044:11657). Icons and images are exported from those frames into `assets/`.
