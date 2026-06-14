// Étapes d'aggregation pour scoper des ALERTES à une zone : Alert.pageUrl est une URL
// complète alors que zone._patternsRegex matche un pathname → on extrait d'abord le
// pathname (technique de référence, identique à zones/[zoneId]/tree.get.ts).

import type { PipelineStage } from 'mongoose'
import { patternsToRegexSource } from '../../shared/utils/zone'

interface ZoneScopeInput {
  isDefault: boolean
  patterns?: string[]
  _patternsRegex?: string | null
}

export function alertZoneScopeStages(zone: ZoneScopeInput): PipelineStage[] {
  const extractPathname = {
    $addFields: {
      _alertPathname: {
        $let: {
          vars: {
            afterProto: {
              $cond: {
                if: { $regexMatch: { input: '$pageUrl', regex: /^https?:\/\// } },
                then: { $arrayElemAt: [{ $split: ['$pageUrl', '://'] }, 1] },
                else: '$pageUrl',
              },
            },
          },
          in: {
            $let: {
              vars: { hostEnd: { $indexOfCP: ['$$afterProto', '/'] } },
              in: {
                $cond: {
                  if: { $eq: ['$$hostEnd', -1] },
                  then: '/',
                  else: { $substrCP: ['$$afterProto', '$$hostEnd', { $strLenCP: '$$afterProto' }] },
                },
              },
            },
          },
        },
      },
    },
  }

  if (zone.isDefault) return [extractPathname]
  // Zone custom : regex stockée, sinon recalculée depuis les patterns (zones d'avant le champ
  // _patternsRegex) — jamais de fallback « site entier » qui sur-rapporterait.
  const regexSource = zone._patternsRegex || patternsToRegexSource(zone.patterns ?? [])
  return [extractPathname, { $match: { _alertPathname: { $regex: regexSource } } }]
}
