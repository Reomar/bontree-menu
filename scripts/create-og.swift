import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count == 3 else {
    fatalError("Expected PDF and output paths")
}
let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
guard let document = CGPDFDocument(input as CFURL), let page = document.page(at: 1),
      let context = CGContext(data: nil, width: 1200, height: 630, bitsPerComponent: 8,
                              bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!,
                              bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else {
    fatalError("Could not read or render the PDF cover")
}
let bounds = page.getBoxRect(.mediaBox)
let scale = max(1200 / bounds.width, 630 / bounds.height)
let x = (1200 - bounds.width * scale) / 2 - bounds.minX * scale
// Center the crop on the tree logo on the current first page.
let logoCenterY = bounds.minY + bounds.height * 0.594
let y = 315 - logoCenterY * scale
context.translateBy(x: x, y: y)
context.scaleBy(x: scale, y: scale)
context.drawPDFPage(page)
guard let image = context.makeImage(),
      let destination = CGImageDestinationCreateWithURL(output as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else {
    fatalError("Could not create the sharing image")
}
CGImageDestinationAddImage(destination, image, [kCGImageDestinationLossyCompressionQuality: 0.95] as CFDictionary)
guard CGImageDestinationFinalize(destination) else {
    fatalError("Could not write the sharing image")
}
