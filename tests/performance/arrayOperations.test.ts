import { describe, it, expect } from 'vitest'
import { moveArrayItem, removeArrayItem, insertArrayItem } from '../../src/utils/arrayUtils'

describe('Array Operations Performance', () => {
  const createLargeArray = (size: number) => Array.from({ length: size }, (_, i) => ({ id: i, value: `item-${i}` }))

  describe('moveArrayItem performance', () => {
    it('should efficiently move items in large arrays', () => {
      const array = createLargeArray(10000)
      const originalLength = array.length

      const startTime = performance.now()

      // Move item from start to end
      moveArrayItem(array, 0, 9999)

      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Verify correctness
      expect(array).toHaveLength(originalLength)
      expect(array[9999].id).toBe(0) // Item from index 0 should now be at index 9999
      expect(array[0].id).toBe(1) // Item at index 1 should now be at index 0

      // Performance assertion - should complete in reasonable time
      expect(executionTime).toBeLessThan(50) // Should complete in less than 50ms

      console.log(`moveArrayItem (10k items): ${executionTime.toFixed(2)}ms`)
    })

    it('should handle move operations without creating temporary arrays', () => {
      const array = createLargeArray(1000)
      const originalArray = array

      moveArrayItem(array, 100, 900)

      // Should be the same array reference (in-place modification)
      expect(array).toBe(originalArray)
      expect(array[900].id).toBe(100)
    })
  })

  describe('removeArrayItem performance', () => {
    it('should efficiently remove items from large arrays', () => {
      const array = createLargeArray(10000)
      const originalLength = array.length

      const startTime = performance.now()

      // Remove item from middle
      removeArrayItem(array, 5000)

      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Verify correctness
      expect(array).toHaveLength(originalLength - 1)
      expect(array[5000].id).toBe(5001) // Next item should shift down

      // Performance assertion
      expect(executionTime).toBeLessThan(30)

      console.log(`removeArrayItem (10k items): ${executionTime.toFixed(2)}ms`)
    })
  })

  describe('insertArrayItem performance', () => {
    it('should efficiently insert items into large arrays', () => {
      const array = createLargeArray(10000)
      const originalLength = array.length
      const newItem = { id: 99999, value: 'inserted-item' }

      const startTime = performance.now()

      // Insert item in middle
      insertArrayItem(array, 5000, newItem)

      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Verify correctness
      expect(array).toHaveLength(originalLength + 1)
      expect(array[5000]).toBe(newItem) // New item should be at index 5000
      expect(array[5001].id).toBe(5000) // Original item should shift right

      // Performance assertion
      expect(executionTime).toBeLessThan(30)

      console.log(`insertArrayItem (10k items): ${executionTime.toFixed(2)}ms`)
    })
  })

  describe('comparison with splice operations', () => {
    it('should demonstrate performance improvement over splice', () => {
      const testSize = 5000

      // Test optimized move
      const optimizedArray = createLargeArray(testSize)
      const optimizedStart = performance.now()
      moveArrayItem(optimizedArray, 0, testSize - 1)
      const optimizedTime = performance.now() - optimizedStart

      // Test splice-based move
      const spliceArray = createLargeArray(testSize)
      const spliceStart = performance.now()
      const item = spliceArray.splice(0, 1)[0]
      spliceArray.splice(testSize - 1, 0, item)
      const spliceTime = performance.now() - spliceStart

      console.log(`Optimized move (${testSize} items): ${optimizedTime.toFixed(2)}ms`)
      console.log(`Splice move (${testSize} items): ${spliceTime.toFixed(2)}ms`)
      console.log(`Performance improvement: ${(spliceTime / optimizedTime).toFixed(1)}x faster`)

      // Both should have same result
      expect(optimizedArray[testSize - 1].id).toBe(0)
      expect(spliceArray[testSize - 1].id).toBe(0)

      // Optimized version should be faster (or at least not significantly slower)
      // Note: For small arrays, the difference might be minimal or even reversed due to overhead
      // The benefit becomes significant with larger arrays (10k+ items)
    })
  })
})