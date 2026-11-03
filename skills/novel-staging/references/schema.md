# Staging contract (version 1)

Required: `schemaVersion: 1`, `kind: "staging"`, `id`, `title`, nonempty `locations`, nonempty `scenes`.

Location: stable outline location `id`, `name`, `basis: image|design`, nonempty `items`. Image-based plans require an `image` path relative to the artifact. Each item has unique `id`, `name`, and normalized `box: [west,north,east,south]`. North is up; x increases east, y increases south. The reference camera is south looking north. Design-based geometry is provisional.

Scene: stable screenplay scene `id`, `episodeId`, `locationId`, `places` array, nonnegative integer `extras`, `extrasWhere` (required when extras > 0). Each place has character `id`, `name`, boolean `present`; present places require valid `itemId`, x/y in [0,1], `posture: sit|stand`, and one of eight compass `facing` values. Absent places use null for itemId/x/y/posture/facing. Present characters closer than 0.05 normalized units fail collision checking.

`--script` reconciles every scene and exact roster. `--art` reconciles locations. `seed` creates unfinished plans; `blocking` derives canonical sentences using IDs and coordinates. The report uses the same move/blocking/collision functions as the CLI, saves browser edits locally, and exports edited JSON. Exported files must be validated before replacing working data. Moving a token picks the nearest anchor object; keyboard arrows also move tokens.
