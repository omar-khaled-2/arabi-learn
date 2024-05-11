import Coordinate from "./Coordinate"

function dbscan(points:Coordinate[],epsilon:number,minPoints:number):number[]{
    const isPointCore:boolean[] = Array(points.length).fill(false)
    const pointClusterIds:number[] = Array(points.length).fill(-1)


    for(let i = 0;i < points.length;i++){
        let nighborCount = 0;
        for(let j = 0;j < points.length;j++){
            if(i == j) continue;
            if(points[i].getDistance(points[j]) < epsilon){
                nighborCount++;
            }
        }
        if(nighborCount >= minPoints)
            isPointCore[i] = true;
    }

    let n = 0;

    const queue = [];
    for(let i = 0;i < points.length;i++){
        if(!isPointCore[i] || pointClusterIds[i] != -1) continue;
        queue.push(i);
        pointClusterIds[i] = n;
        while(queue.length > 0){
            const pointIndex = queue.pop()!;
            for(let j = 0;j < points.length;j++){
                if(pointClusterIds[j] != -1) continue;
                if(points[pointIndex].getDistance(points[j]) < epsilon){
                    if(isPointCore[j]) 
                        queue.push(j);
                    pointClusterIds[j] = n;
                }
            }
        }
        n++;

    }

    return pointClusterIds
}


export default dbscan