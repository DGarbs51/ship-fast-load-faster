<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\MaxSteps;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Attributes\UseSmartestModel;
use Stringable;

/**
 * Same tools and schema as the advisor, but a bigger model and more steps:
 * slow and expensive, so it only ever runs on the queue.
 */
#[UseSmartestModel]
#[MaxSteps(8)]
#[MaxTokens(4096)]
#[Timeout(180)]
class DeepProductAnalyst extends ProductAdvisor
{
    public function instructions(): Stringable|string
    {
        return parent::instructions().<<<'PROMPT'

        This is a deep analysis. Run several searches with different keywords, categories and price
        ceilings, compare the results, and explain trade-offs between the products you recommend.
        PROMPT;
    }
}
