import LabelPredicate from "app/components/github/issues/label-predicate/LabelPredicate.js";

const cases = [
    {
        predicate: "a1",
        matches: [
            ["a1"],
            ["A1", "A2"],
            ["a1", "a2", "a3"],
        ],
        doesNotMatch: [
            [],
            ["a3"],
        ],
    },
    {
        predicate: `"a1"`,
        matches: [
            ["a1"],
            ["A1", "A2"],
            ["a1", "a2", "a3"],
        ],
        doesNotMatch: [
            [],
            ["a3"],
        ],
    },
    {
        predicate: "a1 AND a2",
        matches: [
            ["a1", "a2"],
            ["A1", "A2"],
            ["a1", "a2", "a3"],
        ],
        doesNotMatch: [
            [],
            ["a1"],
            ["a1", "a3"],
        ],
    },
    {
        predicate: "a1 AND (a2 OR a3)",
        matches: [
            ["a1", "a2"],
            ["a1", "a3"],
            ["a1", "a2", "a3"],
            ["a1", "a2", "a4"],
        ],
        doesNotMatch: [
            [],
            ["a1"],
            ["a2"],
            ["a2", "a3"],
        ],
    },
    {
        predicate: "NOT a1",
        matches: [
            [],
            ["a2"],
        ],
        doesNotMatch: [
            ["a1"],
            ["a1", "a2"],
        ],
    },
    {
        predicate: "-a1",
        matches: [
            [],
            ["a2"],
        ],
        doesNotMatch: [
            ["a1"],
            ["a1", "a2"],
        ],
    },
    {
        predicate: "a1 AND NOT a2",
        matches: [
            ["a1"],
            ["a1", "a3"],
        ],
        doesNotMatch: [
            ["a1", "a2"],
            ["a1", "a2", "a3"],
            ["a2"],
        ],
    },
    {
        predicate: "a1 AND -a2",
        matches: [
            ["a1"],
            ["a1", "a3"],
        ],
        doesNotMatch: [
            ["a1", "a2"],
            ["a1", "a2", "a3"],
            ["a2"],
        ],
    },
    {
        predicate: 'a1 AND "a2 a2"',
        matches: [
            ["a1", "a2 a2"],
            ["a1", "a2 a2", "a3"],
        ],
        doesNotMatch: [
            [],
            ["a1"],
            ["a1", "a2"],
        ],
    },
    {
        predicate: String.raw`"complex label with spaces and \" (quotes) and \\ (backslashes)"`,
        matches: [
            [String.raw`complex label with spaces and " (quotes) and \ (backslashes)`],
            [String.raw`complex label with spaces and " (quotes) and \ (backslashes)`, "a2"],
        ],
        doesNotMatch: [
            [],
            ["a2"],
        ],
    },
    {
        predicate: "(",
        throws: true,
    },
    {
        predicate: ")",
        throws: true,
    },
    {
        predicate: "a b",
        throws: true,
    },
    {
        predicate: "",
        throws: true,
    },
];

test("predicate gets evaluated correctly", () =>
{
    for (const c of cases)
    {
        if (c.throws)
        {
            try
            {
                new LabelPredicate(c.predicate);
            }
            catch
            {
                continue;
            }
            
            fail(`Expected predicate "${c.predicate}" to throw.`);
        }
        else
        {
            const labelPredicate = new LabelPredicate(c.predicate);
            
            for (const labels of c.matches ?? [])
            {
                const contextMessage = [
                    `Predicate: '${c.predicate}'`,
                    `Labels: [${labels.map(l => `'${l}'`).join(", ")}]`,
                    `AST:\n${labelPredicate.toString(2)}`,
                ].join("\n  ");
                
                expect(labelPredicate.matches(labels), contextMessage).toBe(true);
            }
            
            for (const labels of c.doesNotMatch ?? [])
            {
                const contextMessage = [
                    `Predicate: '${c.predicate}'`,
                    `Labels: [${labels.map(l => `'${l}'`).join(", ")}]`,
                    `AST:\n${labelPredicate.toString(2)}`,
                ].join("\n  ");
                
                expect(labelPredicate.matches(labels), contextMessage).toBe(false);
            }
        }
    }
});
