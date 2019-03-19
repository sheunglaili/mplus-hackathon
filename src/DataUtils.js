
function DataUtils() {
    this.accumZ = 0;
    this.accumX = 0;
    this.accumY = 0;
    this.maxX = Number.MIN_VALUE;
    this.minX = Number.MAX_VALUE;
    this.maxY = Number.MIN_VALUE;
    this.minY = Number.MAX_VALUE;
    this.maxZ = Number.MIN_VALUE;
    this.minZ = Number.MAX_VALUE;

    this.accumCount = 0;
}

DataUtils.prototype.parseDataParticlesPosition = function (data) {
    var x = data.dimensionDetails ? data.dimensionDetails[0].height : 0;
    var y = parseInt(data.displayDate) ? parseInt(data.displayDate) : data.beginDate;
    var z = data.dimensionDetails ? data.dimensionDetails[0].width : 0;

    this.sumUp(x, y, z)

    return {
        x: x,
        y: y,
        z: z
    };
}

DataUtils.prototype.sumUp = function (x, y, z) {
    if (z && x && y) {
        this.accumZ += z;
        this.accumX += x;
        this.accumY += y;

        if (y < this.minY) {
            this.minY = y;
        }

        if (y > this.maxY) {
            this.maxY = y;
        }

        if (x < this.minX) {
            this.minX = x;
        }

        if (x > this.maxX) {
            this.maxX = x;
        }

        if (z < this.minZ) {
            this.minZ = z;
        }

        if (z > this.maxZ) {
            this.maxZ = z;
        }

        this.accumCount++;
    }
}

DataUtils.prototype.normalize = function (x, y, z) {
    var data = {};

    console.log(x - this.minX)
    console.log(this.maxX - this.minX);

    data.x = x ? (x - this.minX) / (this.maxX - this.minX) : 0;
    data.y = y ? (y - this.minY) / (this.maxY - this.minY) : 0;
    data.z = z ? (z - this.minZ) / (this.maxZ - this.minZ) : 0;
    console.log(data)
    return data
}

DataUtils.prototype.rationalize = function (x, y, z, r) {
    var data = {};
    data.x = x * r - r / 2;
    data.y = y * r - r / 2;
    data.z = z * r - r / 2;
    return data;
}

DataUtils.prototype.sine = function (x, y, z) {
    var data = {};
    data.x = Math.sin(x);
    data.y = Math.sin(y)
    data.z = Math.sin(z);
    return data
}

// DataUtils.prototype.log = function(x,y,z){
//     var data = {};
//     data.x = Math.log(10,x); 
//     data.y = Math.log(10,y;
//     data.z = Math.log(10,z);
//     return data
// }

DataUtils.prototype.getAvgZ = function (data) {
    return (this.accumZ / this.accumCount);
}

DataUtils.prototype.getAvgX = function (data) {
    return (this.accumX / this.accumCount);
}

DataUtils.prototype.getAvgY = function (data) {
    return (this.accumY / this.accumCount);
}


// function parseDataParticlesPosition(data) {
//     var x = data.dimensionDetails[0].height;
//     var y = data.dimensionDetails[0].width;
//     var z = parseInt(data.displayDate);
//     return [x, y, z];
// }

// function getAverageZ() {
//     return accumZ / accumZCount;
// }

