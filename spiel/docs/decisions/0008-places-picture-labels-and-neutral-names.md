# 0008 The places as a picture, labels beside their lane, and the names Kim and Robin

- Question: Lars played the story on 15 November 2026 to decide whether its pictures can explain the process in the slides of workshop 1. Three things were missing or wrong: no picture of local and remote (one repository on the laptop, one on GitHub, push and pull between them); after the clone scene nothing in the picture showed two clones; the labels of the commits on the left lane stood in the column on the far right, next to the other person's lane.
- Choice:
  - A second picture above the commit graph, the places: one box for GitHub and one per laptop, in the order of the lanes (the second person on the left, GitHub in the middle, the first person on the right). Every box has one row per commit of the story. A filled dot is a commit this place holds, an empty circle a commit that has not arrived there, a dashed outline a commit that exists only on that laptop. A clone, push or pull of the current scene is an arrow with its word between the boxes. A laptop without a copy is a dashed box with the words "noch keine Kopie".
  - What a laptop holds is derived, not stored: everything reachable from where its main stands and from the tips of the person's own branches. The model is unchanged.
  - The label of a commit stands beside its own lane: to the left for the left lane, to the right for main and the right lane.
  - The two people are Kim and Robin (letters K and R). The texts name the person instead of using a pronoun. The example username in the exercises is `setup-kim`.
  - Stills for slides come from the page itself: `geschichte.html?g=<id>&szene=<n>&bild=1` shows the two pictures only, `teil=orte` or `teil=graph` one of them.
- Why: the course wants one visual language from the slides to the game, and the words local and remote need a picture of places before a picture of history. Names that fit every gender, asked for by Lars.
- Consequences: the graph is 540 units wide instead of 420, so on a phone the text in it is about a fifth smaller. Stories with more than two people would need a rule for the order of the boxes.
- Date: 2026-11-15
