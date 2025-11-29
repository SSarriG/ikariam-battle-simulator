import { UnitType } from './enums';

export class SlotOrderService {
    /**
     * Returns an array of slot indices in the order they should be filled
     */
    static getFillOrder(lineType: UnitType, numSlots: number): number[] {
        const indices = Array.from({ length: numSlots }, (_, i) => i);

        switch (lineType) {
            case UnitType.FirstLine:
            case UnitType.Ranged:
            case UnitType.Artillery:
                return this.getCenterOutOrder(indices);

            case UnitType.Flank:
            case UnitType.Bomber:
                return this.getOutsideInOrder(indices);

            case UnitType.AntiAir:
                return this.getOutsideInRightFirstOrder(indices);

            default:
                return indices; // Default left-to-right
        }
    }

    /**
     * Center-Out: Start from middle, alternate left/right outwards
     * Example (7 slots): 3, 2, 4, 1, 5, 0, 6
     */
    private static getCenterOutOrder(indices: number[]): number[] {
        const n = indices.length;
        if (n === 0) return [];

        const centerIndex = Math.floor(n / 2);
        const result = [indices[centerIndex]];

        let left = centerIndex - 1;
        let right = centerIndex + 1;

        while (left >= 0 || right < n) {
            if (left >= 0) result.push(indices[left]);
            if (right < n) result.push(indices[right]);
            left--;
            right++;
        }

        return result;
    }

    /**
     * Outside-In: Start from edges, alternate left/right inwards
     * Example (7 slots): 0, 6, 1, 5, 2, 4, 3
     */
    private static getOutsideInOrder(indices: number[]): number[] {
        const n = indices.length;
        if (n === 0) return [];

        const result: number[] = [];
        let left = 0;
        let right = n - 1;

        while (left <= right) {
            if (left === right) {
                result.push(indices[left]);
            } else {
                result.push(indices[left]);
                result.push(indices[right]);
            }
            left++;
            right--;
        }

        return result;
    }

    /**
     * Outside-In (Right First): Start from edges, alternate right/left inwards
     * Example (7 slots): 6, 0, 5, 1, 4, 2, 3
     */
    private static getOutsideInRightFirstOrder(indices: number[]): number[] {
        const n = indices.length;
        if (n === 0) return [];

        const result: number[] = [];
        let left = 0;
        let right = n - 1;

        while (left <= right) {
            if (left === right) {
                result.push(indices[left]);
            } else {
                result.push(indices[right]);
                result.push(indices[left]);
            }
            left++;
            right--;
        }

        return result;
    }
}
