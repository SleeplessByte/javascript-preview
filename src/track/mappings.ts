import { SupportedTrack } from "./types"

export const TRACK_TO_CODE_LANGUAGE: Record<SupportedTrack, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
}

export const SOURCE_EXT: Record<SupportedTrack, string> = {
  javascript: 'js',
  typescript: 'ts',
}

export const TESTS_EXT: Record<SupportedTrack, string> = {
  javascript: 'spec.js',
  typescript: 'test.ts',
}
