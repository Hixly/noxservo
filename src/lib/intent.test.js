import { describe, it, expect } from 'vitest'
import { classifyIntent } from './intent.js'

describe('classifyIntent', () => {
  it('treats short keyword queries as direct', () => {
    expect(classifyIntent('react router docs')).toBe('direct')
    expect(classifyIntent('tailwind grid')).toBe('direct')
    expect(classifyIntent('weather')).toBe('direct')
  })

  it('treats bare navigational terms and URLs as direct', () => {
    expect(classifyIntent('github')).toBe('direct')
    expect(classifyIntent('noxservo.com')).toBe('direct')
    expect(classifyIntent('news.ycombinator.com')).toBe('direct')
  })

  it('treats trailing-question-mark queries as questions', () => {
    expect(classifyIntent('rain?')).toBe('question')
    expect(classifyIntent('why is the sky blue?')).toBe('question')
  })

  it('treats question-word openers (3+ words) as questions', () => {
    expect(classifyIntent('what is the speed of light')).toBe('question')
    expect(classifyIntent('how do I center a div')).toBe('question')
    expect(classifyIntent('compare vite and webpack')).toBe('question')
  })

  it('does not treat a 2-word question-word phrase as a question', () => {
    expect(classifyIntent('what time')).toBe('direct')
  })

  it('treats long natural-language queries (8+ words) as questions', () => {
    expect(classifyIntent('best laptop for video editing under 2000 dollars 2026')).toBe('question')
  })

  it('treats empty or whitespace input as direct', () => {
    expect(classifyIntent('')).toBe('direct')
    expect(classifyIntent('   ')).toBe('direct')
  })
})
