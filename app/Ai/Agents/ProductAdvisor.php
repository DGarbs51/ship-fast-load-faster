<?php

namespace App\Ai\Agents;

use App\Ai\Tools\SearchProducts;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\MaxSteps;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\UseCheapestModel;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Promptable;
use Stringable;

#[UseCheapestModel]
#[MaxSteps(4)]
#[MaxTokens(1024)]
class ProductAdvisor implements Agent, HasStructuredOutput, HasTools
{
    use Promptable;

    public function instructions(): Stringable|string
    {
        return <<<'PROMPT'
        You are a merchandising advisor for an online store's admin team.
        Always call the SearchProducts tool before recommending anything, and only recommend products it returned.
        Prefer products that are in stock, sell well, and are highly rated. Recommend at most 5 products.
        PROMPT;
    }

    public function tools(): iterable
    {
        return [new SearchProducts];
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'recommendations' => $schema->array()->items($schema->object(fn (JsonSchema $schema): array => [
                'product_id' => $schema->integer()->required(),
                'name' => $schema->string()->required(),
                'reason' => $schema->string()->required(),
            ]))->required(),
            'confidence' => $schema->number()->min(0)->max(1)->required(),
            'reasoning' => $schema->string()->required(),
        ];
    }
}
