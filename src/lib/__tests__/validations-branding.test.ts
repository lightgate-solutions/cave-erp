import { describe, it, expect } from "vitest";
import { validateLogoFile } from "../validations/branding";

/**
 * Helper to create a mock File object for testing.
 */
function createMockFile(
    name: string,
    sizeBytes: number,
    type: string,
): File {
    const buffer = new ArrayBuffer(sizeBytes);
    return new File([buffer], name, { type });
}

describe("validations/branding", () => {
    describe("validateLogoFile", () => {
        it("should accept a valid PNG file under 2MB", () => {
            const file = createMockFile("logo.png", 1024 * 1024, "image/png");
            const result = validateLogoFile(file);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it("should accept a valid JPEG file", () => {
            const file = createMockFile("photo.jpg", 500 * 1024, "image/jpeg");
            const result = validateLogoFile(file);
            expect(result.valid).toBe(true);
        });

        it("should accept a valid SVG file", () => {
            const file = createMockFile("icon.svg", 10 * 1024, "image/svg+xml");
            const result = validateLogoFile(file);
            expect(result.valid).toBe(true);
        });

        it("should reject files over 2MB", () => {
            const file = createMockFile(
                "huge.png",
                3 * 1024 * 1024,
                "image/png",
            );
            const result = validateLogoFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("2MB");
        });

        it("should reject files at exactly over 2MB", () => {
            const file = createMockFile(
                "edge.png",
                2 * 1024 * 1024 + 1,
                "image/png",
            );
            const result = validateLogoFile(file);
            expect(result.valid).toBe(false);
        });

        it("should accept files at exactly 2MB", () => {
            const file = createMockFile(
                "exact.png",
                2 * 1024 * 1024,
                "image/png",
            );
            const result = validateLogoFile(file);
            expect(result.valid).toBe(true);
        });

        it("should reject unsupported file types", () => {
            const file = createMockFile("doc.pdf", 100 * 1024, "application/pdf");
            const result = validateLogoFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("PNG");
        });

        it("should reject GIF files", () => {
            const file = createMockFile("anim.gif", 100 * 1024, "image/gif");
            const result = validateLogoFile(file);
            expect(result.valid).toBe(false);
        });

        it("should reject WebP files", () => {
            const file = createMockFile("photo.webp", 100 * 1024, "image/webp");
            const result = validateLogoFile(file);
            expect(result.valid).toBe(false);
        });
    });
});
