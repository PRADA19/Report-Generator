/**
 * Utility to preprocess images in the browser before running OCR.
 * Applies Grayscale, Contrast Stretching, and Binarization to enhance text recognition.
 */

const fileToImage = (file: File | Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for canvas preprocessing."));
    };
    img.src = url;
  });
};

export async function preprocessForOCR(file: File | Blob): Promise<Blob> {
  try {
    const img = await fileToImage(file);
    
    // Create offscreen canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to get 2D canvas context.");
    }
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw original image
    ctx.drawImage(img, 0, 0);
    
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    
    // 1. Grayscale Conversion using standard luminance weights
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      d[i] = d[i + 1] = d[i + 2] = gray;
    }
    
    // 2. Contrast Stretching
    // Find minimum and maximum gray values
    let minGray = 255;
    let maxGray = 0;
    for (let i = 0; i < d.length; i += 4) {
      const g = d[i];
      if (g < minGray) minGray = g;
      if (g > maxGray) maxGray = g;
    }
    
    const range = maxGray - minGray;
    
    // Stretch and apply Adaptive Binarization (Thresholding)
    if (range > 0) {
      // We set a dynamic threshold halfway through the range
      const threshold = minGray + (range * 0.48); // Slightly offset to retain thin fonts
      for (let i = 0; i < d.length; i += 4) {
        // Binarize: Compare the grayscaled pixel value directly with the threshold
        const binary = d[i] < threshold ? 0 : 255;
        d[i] = d[i + 1] = d[i + 2] = binary;
      }
    }
    
    // Write pixel array back to canvas
    ctx.putImageData(imgData, 0, 0);
    
    // Export canvas as a PNG blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas conversion to blob failed."));
      }, "image/png");
    });
  } catch (error) {
    console.error("Canvas image preprocessing failed, returning original file:", error);
    return file; // Return original unchanged file as fallback
  }
}
