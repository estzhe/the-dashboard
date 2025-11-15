import SimpleToken from "app/components/github/issues/label-predicate/tokenizer/SimpleToken.js";
import LabelToken from "app/components/github/issues/label-predicate/tokenizer/LabelToken.js";

type Token = SimpleToken | LabelToken;

export default Token;