/**
 * Created by Estevao on 15/10/2015.
 */

var patchPattern = /-([\w-.]+)/;

function split(v) {
  var temp = v.split('.');
  var arr = temp.splice(0, 2);
  arr.push(temp.join('.'));
  return arr;
}

function compareVersions(v1, v2) {
  var s1 = split(v1);
  var s2 = split(v2);

  for (var i = 0; i < 3; i++) {
    var n1 = parseInt(s1[i] || 0, 10);
    var n2 = parseInt(s2[i] || 0, 10);

    if (n1 > n2) return 1;
    if (n2 > n1) return -1;
  }

  if ((s1[2] + s2[2] + '').indexOf('-') > -1) {
    var p1 = (patchPattern.exec(s1[2]) || [''])[0];
    var p2 = (patchPattern.exec(s2[2]) || [''])[0];

    if (p1 === '') return 1;
    if (p2 === '') return -1;
    if (p1 > p2) return 1;
    if (p2 > p1) return -1;
  }

  return 0;
}


function markTocItems(arr) {
  const targetStyles = new Set([
    "html-h1",
    "html-h2",
    "html-h3",
    "html-h4",
    "html-h5"
  ]);

  function traverse(array) {
    for (const item of array) {
      if (item && typeof item === 'object') {
        // 检查当前对象是否有 style 数组，并且包含目标样式
        if (Array.isArray(item.style)) {
          const hasTargetStyle = item.style.some(style => targetStyles.has(style));
          if (hasTargetStyle) {
            item.tocItem = true;
          }
        }

        // 遍历子属性中的数组（递归）
        for (const key in item) {
          if (Array.isArray(item[key])) {
            traverse(item[key]);
          }
        }
      }
    }
  }

  traverse(arr);
}
