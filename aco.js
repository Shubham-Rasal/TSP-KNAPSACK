const ANT_COUNT = 10000;
const POINT_COUNT = 5;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

document.onload = () => {
  canvas.width = ctx.clientWidth;
  canvas.height = ctx.clientHeight;
};

const generatePoints = (count) => {
  const points = [];
  for (let i = 0; i < count; i++) {
    points.push({
      x: Math.round(Math.random() * canvas.width),
      y: Math.round(Math.random() * canvas.height),
      id: i,
      enjoyment: Math.round(Math.random() * 100),
    });
  }

  return points;
};

const distance = (a, b) => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

const pathDistance = (path) => {
  let sum = 0;
  for (let i = 0; i < path.length - 1; i++) {
    sum += distance(path[i], path[i + 1]);
  }
  return sum;
};

const points = generatePoints(POINT_COUNT);

const rewardMatrix = [];
for (let i = 0; i < points.length; i++) {
  rewardMatrix[i] = [];
  for (let j = 0; j < points.length; j++) {
    rewardMatrix[i][j] = 1;
  }
}

const getPath = ({ startX, startY, startId, points }) => {
  //get sum of distances from start to any other point
  const path = [];
  // console.log(rewardMatrix)

  //initialise reward matrix
  while (points.length > 1) {
    const sum = points.reduce((acc, point) => {
      if (point.id != startId) {
        //add reward matrix to the distance
        return (
          acc +
          (1 / distance({ x: startX, y: startY }, point)) *
            rewardMatrix[startId][point.id]
        );
      }
      return acc;
    }, 0);

    // console.log(sum);
    //get probability of choosing any other point
    const probability = points.map((point) => {
      if (point.id != startId) {
        return {
          point,
          probability:
            //use reward matrix along with distance to calculate probability
            (((1 / distance({ x: startX, y: startY }, point)) *
              rewardMatrix[startId][point.id]) /
              sum /
              100) *
            100,
        };
      }
      return { point, probability: 0 };
    });

    let cumulativeProbability = 0;
    const cumulativeProbabilities = probability.map((prob) => {
      cumulativeProbability += prob.probability;
      return { point: prob.point, cumulativeProbability };
    });

    // console.log(cumulativeProbabilities);

    //get random number between cumulative probability and 0
    const random = Math.random() * cumulativeProbability;

    const chosenPoint = cumulativeProbabilities.find((prob) => {
      return random <= prob.cumulativeProbability;
    }).point;

    points = points.filter((point) => point.id != chosenPoint.id);

    path.push(chosenPoint);
  }

  return path;
};

//initialise reward matrix

//plot on the canvas


function draw(path) {
  //   ctx.fillStyle = "white";
  //   ctx.fillRect(0, 0, canvas.width, canvas.height);
  //get a random color
  
  const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  path.forEach((point) => {
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
    //write the id of the point
    ctx.font = "10px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(point.id, point.x + 5, point.y + 5);
    ctx.fill();
    ctx.moveTo(point.x, point.y);
  });
  ctx.lineTo(path[0].x, path[0].y);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(path[0].x, path[0].y, 3, 0, 2 * Math.PI);
  ctx.fill();
  ctx.moveTo(path[0].x, path[0].y);
}

// draw(path);

//get a path for each ant
const ants = [];
for (let i = 0; i < ANT_COUNT; i++) {
  //start at a random point
  const start = points[Math.floor(Math.random() * points.length)];
  const path = getPath({
    startX: start.x,
    startY: start.y,
    startId: start.id,
    points,
  });
  path.push(start);
  ants.push(path);
  //   console.log(path);
  //update reward matrix
  for (let i = 0; i < path.length - 1; i++) {
    rewardMatrix[path[i].id][path[i + 1].id] +=
      Math.round((1 / distance(path[i], path[i + 1])) * 100) / 100;
    rewardMatrix[path[i + 1].id][path[i].id] +=
      Math.round((1 / distance(path[i], path[i + 1])) * 100) / 100;
  }
}

// console.table(rewardMatrix);

//get the path distance for each ant
const pathDistances = ants.map((ant) => {
  return Math.round(pathDistance(ant) * 100) / 100;
});

//get the shortest path
const shortestPath = ants[pathDistances.indexOf(Math.min(...pathDistances))];
console.log(shortestPath);

draw(shortestPath);

// const worstPath = ants[pathDistances.indexOf(Math.max(...pathDistances))];
// console.log(worstPath);

//add the distaces from the points and display
// console.log(pathDistances);

// draw(worstPath);

// let path_distance = 1000;

//since the use has limited path length, we need to find the best path using knapsack
//we will use the enjoyment as the value and the distance as the weight
//function should return a cut down path
//we will use the recursive formula

const knapsack = (capacity, path, res = [], index = 0) => {
  //base case
  if (index >= path.length) {
    return res;
  }

  //if the weight is greater than the capacity, we will not include it
  if (pathDistance(res) > capacity) {
    return res;
  }

  //if the weight is less than the capacity, we will include it
  const lastPoint = res[res.length - 1];
  const currentPoint = path[index];
  if (lastPoint) {
    if (distance(lastPoint, currentPoint) <= capacity) {
      res.push(currentPoint);
    } else {
      index++;
    }
  } else {
    res.push(currentPoint);
  }

  return knapsack(capacity, path, res, index + 1);
};

//slider for time
const slider = document.getElementById("time");
const time = document.getElementsByClassName("time-value");
slider.oninput = function () {
  time[0].innerHTML = `Time: ${this.value}`;
};

const start = document.getElementById("start");
start.onclick = function () {
  //get the path
  const path = knapsack(slider.value, shortestPath);
  console.log(path);
  draw(path);
}



