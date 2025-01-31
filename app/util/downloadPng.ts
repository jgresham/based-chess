// Function to convert SVG to PNG
// const downloadPng = (svgRef: React.RefObject<SVGSVGElement>) => {
//   const svgElement = svgRef.current;
//   if (svgElement) {
//     const svgString = new XMLSerializer().serializeToString(svgElement);
//     const canvas = document.createElement("canvas");
//     const context = canvas.getContext("2d");

import html2canvas from "html2canvas";

//     const img = new Image();
//     const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
//     const url = URL.createObjectURL(svgBlob);

//     img.onload = () => {
//       canvas.width = img.width;
//       canvas.height = img.height;
//       if (context) {
//         context.drawImage(img, 0, 0);
//       } else {
//         console.error("downloadPng: Canvas context not found");
//       }
//       URL.revokeObjectURL(url);

//       const pngUrl = canvas.toDataURL("image/png");
//       const link = document.createElement("a");
//       link.href = pngUrl;
//       link.download = "image.png";
//       link.click();
//     };

//     img.src = url;
//   }
// };

export const downloadPng = (elementRef: React.RefObject<HTMLDivElement> | null) => {
  const element = elementRef?.current;
  if (!element) {
    console.error("downloadPng: Element not found");
    return;
  }

  html2canvas(element, { backgroundColor: null }).then((canvas) => {
    // Convert canvas to PNG
    const pngUrl = canvas.toDataURL("image/png");

    // Create a download link
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = "chessboard.png";
    link.click();
  });
};

export const copyPngToClipboard = (elementRef: React.RefObject<HTMLDivElement> | null) => {
  const element = elementRef?.current;
  if (!element) {
    console.error("copyPngToClipboard: Element not found");
    return;
  }

  html2canvas(element, { backgroundColor: null }).then((canvas) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard.write([item]).then(() => {
          alert("Board screenshot copied!");
        }).catch((err) => {
          console.error("Failed to copy PNG", err);
          // try download?
          downloadPng(elementRef);
        });
      }
    });
  });
};