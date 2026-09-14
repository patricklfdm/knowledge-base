"""Deterministic bounded adapter protocol; budget units are not currency or tokens."""
import copy
from answers import context,baseline,validate_output
from retrieval import Index,canonical,load_fixture


class TransientFailure(Exception):pass
class PermanentFailure(Exception):pass


def run(index,query,adapter,*,max_attempts=2,budget_units=2,call_cost=1):
    if any(type(value) is not int for value in [max_attempts,budget_units,call_cost]):raise ValueError("budget types")
    if not 1<=max_attempts<=3 or not 0<=budget_units<=10 or not 1<=call_cost<=10:raise ValueError("budget limits")
    ctx=context(index,query);trace=[];remaining=budget_units
    def result(state,answer=None):
        return {"state":state,"answer":answer,"remaining_units":remaining,"trace":trace}
    if not ctx["sources"]:return result("abstained",baseline(ctx))
    for attempt in range(1,max_attempts+1):
        if remaining < call_cost:
            return result("budget_exhausted")
        remaining-=call_cost
        try:
            raw=adapter(copy.deepcopy(ctx))
        except TransientFailure:
            trace.append({"attempt":attempt,"outcome":"transient"})
            continue
        except PermanentFailure:
            trace.append({"attempt":attempt,"outcome":"permanent"})
            return result("dependency_error")
        try:answer=validate_output(raw,ctx)
        except ValueError:
            trace.append({"attempt":attempt,"outcome":"invalid_output"})
            return result("invalid_output")
        trace.append({"attempt":attempt,"outcome":"validated"})
        return result(answer["status"],answer)
    return result("attempts_exhausted")


class ScriptedAdapter:
    """Owned fixture outcomes; never imports or executes retrieved instructions."""
    def __init__(self,outcomes):self.outcomes=list(outcomes);self.calls=0
    def __call__(self,ctx):
        if self.calls>=len(self.outcomes):raise PermanentFailure("fixture exhausted")
        outcome=self.outcomes[self.calls];self.calls+=1
        if outcome=="transient":raise TransientFailure("synthetic unavailable")
        if outcome=="permanent":raise PermanentFailure("synthetic forbidden")
        if outcome=="invalid":return b'{"tool":"send_message"}'
        if outcome=="ok":return canonical(baseline(ctx))
        raise PermanentFailure("unknown fixture outcome")


def demo():
    index=Index(load_fixture("corpus.json"))
    return {"recovered":run(index,"HTTP超时",ScriptedAdapter(["transient","ok"])),
            "budget_stopped":run(index,"HTTP超时",ScriptedAdapter(["transient","ok"]),budget_units=1),
            "invalid_stopped":run(index,"HTTP超时",ScriptedAdapter(["invalid","ok"]))}
