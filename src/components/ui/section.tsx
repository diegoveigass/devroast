import type { ComponentProps } from "react";

export type SectionRootProps = ComponentProps<"section">;

function SectionRoot({ className, ...props }: SectionRootProps) {
  return <section className={className} {...props} />;
}

export type SectionHeaderProps = ComponentProps<"div">;

function SectionHeader({ className, ...props }: SectionHeaderProps) {
  return (
    <div
      className={["flex flex-col gap-2", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export type SectionTitleProps = ComponentProps<"div">;

function SectionTitle({ children, className, ...props }: SectionTitleProps) {
  return (
    <div
      className={[
        "flex items-center gap-2 font-mono text-sm font-bold text-text-primary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span className="text-accent-green">{"//"}</span>
      <span>{children}</span>
    </div>
  );
}

export type SectionDescriptionProps = ComponentProps<"p">;

function SectionDescription({ className, ...props }: SectionDescriptionProps) {
  return (
    <p
      className={["max-w-2xl text-sm leading-7 text-text-secondary", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export const Section = {
  Description: SectionDescription,
  Header: SectionHeader,
  Root: SectionRoot,
  Title: SectionTitle,
};
