# Diagrams for a design

## Which diagrams

- **Container diagram**, always: deployable units, data stores, brokers,
  external systems, and the people or devices that use them.
- **Sequence diagram** for the critical flow when it crosses more than two
  components or has asynchronous steps.
- Keep each diagram under about 15 boxes. Split by boundary when it grows.

## Conventions

- Name a box by its role, then the technology: `Telemetry ingest (.NET worker)`.
- Label every edge with what flows and how: `telemetry · MQTT/TLS`.
- Solid edge for a synchronous request, dashed for an asynchronous message or
  event.
- Group boxes by trust boundary or deployment unit, and name the group for what
  it is: `Field (untrusted)`, `VPS`, `Azure`.
- Color by status, with a legend: existing (neutral), new (accent), changed
  (warning), external (grey, dashed border).

## Choose the tool

```bash
drawio=$(command -v drawio || ls /Applications/draw.io.app/Contents/MacOS/draw.io 2>/dev/null)
[ -z "$drawio" ] && flatpak info com.jgraph.drawio.desktop >/dev/null 2>&1 && drawio="flatpak run com.jgraph.drawio.desktop"
```

Use draw.io Desktop when it is found, Mermaid otherwise. Do not install it
yourself; tell the user the command (`brew install --cask drawio` on macOS,
`flatpak install flathub com.jgraph.drawio.desktop` on Linux).

### With draw.io Desktop

1. Write the diagram as Mermaid in `<slug>.mmd`. Write draw.io XML in
   `<slug>.drawio` directly instead when the diagram needs shapes or placement
   Mermaid cannot express.
2. Convert to draw.io, then export an SVG that embeds the diagram:

   ```bash
   $drawio -x -f xml -o <slug>.drawio <slug>.mmd
   $drawio -x -f svg -e -b 10 -o <slug>.drawio.svg <slug>.drawio
   ```

   Convert first: exporting Mermaid straight to an image with `-e` fails in
   current draw.io Desktop. For hand-placed XML whose edges cross boxes, run
   `$drawio -x -f xml --layout libavoid -o <slug>.drawio <slug>.drawio` before
   exporting.
3. Delete `<slug>.mmd`. From now on `<slug>.drawio` is the source. The
   `.drawio.svg` is what the document and the page show, and draw.io opens it
   as an editable diagram.
4. The document embeds `![<title>](<slug>.drawio.svg)`; the page inlines the
   SVG markup inside its canvas.

### With Mermaid

1. Keep the diagram in `<slug>.mmd`. Paste the same text into the document as a
   fenced `mermaid` block, which GitHub renders, and into the page as
   `<pre class="mermaid">`, which the Artifact viewer renders.
2. Stick to syntax every renderer accepts: `flowchart LR`, `subgraph`, the
   shapes `[ ]`, `( )`, `([ ])`, `[( )]` (data store) and `{{ }}`, edges
   `-->` and `-.->` with `|label|`, `classDef` and `class`. The newer
   `@{ shape: ... }` syntax and `architecture-beta` fail on older renderers.
3. Give each `classDef` a fill and a dark text color together, so boxes stay
   readable on light and dark pages.

## Edit link

`$HARNESS/bin/drawio-url <slug>.drawio` or `<slug>.mmd` prints an
`app.diagrams.net` link that opens the diagram in the draw.io editor. The
diagram travels compressed in the URL fragment, which the browser does not
send to the server. Put the link on the page and in the document.

## Check

Look at the published page once: every box labeled, no edge crossing a label,
legend colors matching the boxes. Fix what is wrong and republish once.
