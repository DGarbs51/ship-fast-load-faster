<?php

namespace App\Ai;

use Illuminate\Support\Str;

/**
 * Cache keys for advisor answers. Normalisation is deliberately conservative:
 * case, extra whitespace and trailing ?/!/. are ignored, so "Desk lamps?" and
 * "desk lamps" share an answer, but "< $100" and "> $100" never do.
 */
class AdvisorCache
{
    public static function answer(string $question): string
    {
        return 'ai:advisor:answer:'.self::hash($question);
    }

    public static function deepAnalysis(string $question): string
    {
        return 'ai:advisor:deep:'.self::hash($question);
    }

    public static function deepAnalysisPending(string $question): string
    {
        return self::deepAnalysis($question).':pending';
    }

    public static function hash(string $question): string
    {
        return hash('xxh128', Str::of($question)->lower()->squish()->rtrim('?!.')->rtrim()->value());
    }
}
