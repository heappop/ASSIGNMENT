const {
scoreWindows
}=require("./lib/score");


console.log(
scoreWindows([
{
date:"2026-08-01",
tempMax:25,
tempMin:20,
precipProbability:0,
windMax:5
},
{
date:"2026-08-02",
tempMax:26,
tempMin:21,
precipProbability:5,
windMax:6
},
{
date:"2026-08-03",
tempMax:24,
tempMin:19,
precipProbability:0,
windMax:5
}
])
);