import SimpleToken from "app/components/github/issues/label-list/tokenizer/SimpleToken.js";
import LabelToken from "app/components/github/issues/label-list/tokenizer/LabelToken.js";

type Token = SimpleToken | LabelToken;

export default Token;