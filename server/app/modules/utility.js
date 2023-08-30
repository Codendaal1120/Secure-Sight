/** Scales a number from one range to another */
function mapRange (value, inMin, inMax, outMin, outMax) {
    value = (value - inMin) / (inMax - inMin);
    return outMin + value * (outMax - outMin);
}

// function dateToTimeString(date) {
//     var mm = this.getHour() + 1; // getMonth() is zero-based
//     var dd = this.getDate();
  
//     return [this.getFullYear(),
//             (mm>9 ? '' : '0') + mm,
//             (dd>9 ? '' : '0') + dd
//            ].join('');
// }

// Date.prototype.yyyymmdd = function() {
//     var mm = this.getMonth() + 1; // getMonth() is zero-based
//     var dd = this.getDate();
  
//     return [this.getFullYear(),
//             (mm>9 ? '' : '0') + mm,
//             (dd>9 ? '' : '0') + dd
//            ].join('');
//   };

module.exports.mapRange = mapRange;