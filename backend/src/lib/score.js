// Pure function to rank consecutive forecast windows

function scoreWindows(days, options = {}) {

    const windowSize = options.windowSize || 3;

    const results = [];


    // Generate every possible window
    for (
        let i = 0;
        i <= days.length - windowSize;
        i++
    ) {

        const window = days.slice(
            i,
            i + windowSize
        );


        let tempScores = [];
        let precipScores = [];
        let windScores = [];


        let hasMissingData = false;


        window.forEach(day => {


            // Check missing values explicitly
            if (
                day.tempMax === null ||
                day.precipProbability === null ||
                day.windMax === null
            ) {
                hasMissingData = true;
            }


            // Temperature scoring
            if (day.tempMax !== null) {

                const distance = Math.abs(
                    day.tempMax - 25
                );

                tempScores.push(
                    Math.max(
                        0,
                        100 - distance * 10
                    )
                );

            }


            // Rain penalty
            if(day.precipProbability !== null){

                precipScores.push(
                    100 - day.precipProbability
                );

            }


            // Wind penalty
            if(day.windMax !== null){

                windScores.push(
                    Math.max(
                        0,
                        100 - day.windMax * 2
                    )
                );

            }


        });


        // Average only available values
        const temp =
            average(tempScores);


        const precip =
            average(precipScores);


        const wind =
            average(windScores);



        const score =
            clamp(
                (
                    temp * 0.5 +
                    precip * 0.3 +
                    wind * 0.2
                ),
                0,
                100
            );


        results.push({

            startDate:
                window[0].date,

            endDate:
                window[window.length-1].date,


            score:
                Number(score.toFixed(1)),


            hasMissingData,


            breakdown:{
                temp:Number(temp.toFixed(1)),
                precip:Number(precip.toFixed(1)),
                wind:Number(wind.toFixed(1))
            }

        });


    }


    // Deterministic sorting
    return results.sort(
        (a,b)=>{

            if(b.score !== a.score)
                return b.score-a.score;


            return a.startDate.localeCompare(
                b.startDate
            );

        }
    );

}



// Calculate safe average
function average(values){

    if(values.length===0)
        return 0;


    return values.reduce(
        (a,b)=>a+b,
        0
    ) / values.length;

}



// Keep values inside range
function clamp(value,min,max){

    return Math.min(
        Math.max(value,min),
        max
    );

}


module.exports={
    scoreWindows
};