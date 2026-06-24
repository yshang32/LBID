import { HeroOpportunity } from "../components/HeroOpportunity";
import { PipelineQueue }   from "../components/PipelineQueue";
import { RecentActivity }  from "../components/RecentActivity";
import { StatsStrip }      from "../components/StatsStrip";

export function TodayPage() {
  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-0">
      {/* Page greeting */}
      <div className="mb-7">
        <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-2 m-0">
          Good morning, Kenny.
        </h1>
        <p className="text-[14px] text-ink-3 font-normal">
          1 high-priority opportunity needs your attention today.
        </p>
      </div>

      {/* Stats strip — context, quieter than hero */}
      <div className="mb-6">
        <StatsStrip />
      </div>

      {/* Hero — the ONE focal point */}
      <div className="mb-5">
        <HeroOpportunity />
      </div>

      {/* Below fold: Pipeline + Activity */}
      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: "1fr 380px" }}>
        <PipelineQueue />
        <RecentActivity />
      </div>
    </div>
  );
}
