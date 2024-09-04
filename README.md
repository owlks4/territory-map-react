A browsable and highly interactive map of Birmingham territory alignments, from a roleplaying game (a bit like a fictionalised version of model united nations).

The map is stored a list of week-by-week ownership changes in JSON format. This increases space efficiency and avoids having to store a complete set of mostly identical alignments for every single week.

This interactive version of the map also incorporates a baseline level of analysis functionality. Clicking a territory will show its complete ownership history as a Gantt chart (custom implementation using react components). Clicking a Gantt chart segment or the relevant legend item will also present that aspect of the map to the user as a ChartJS line graph.