import { createFileRoute, createLink, type LinkComponent } from "@tanstack/react-router";
import { Configuration, DefaultApi } from "@/clients/word-hunt-service";
import Header from "@/components/Header";
import {
  type ButtonHTMLAttributes,
  type Ref,
} from "react";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <>
      <Header />
      <h1>Word Hunt</h1>
      <ButtonLink to="/match">Nav to match!</ButtonLink>
      <button
        onClick={() => {
          const config = new Configuration({
            basePath: "http://localhost:5173/api",
          });
          new DefaultApi(config).pingPingGet().then((res) => console.log(res));
        }}
      >
        Click me!
      </button>
    </>
  );
}

interface ButtonLinkProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

const ButtonLinkComponent = (
  props: ButtonLinkProps & { ref?: Ref<HTMLButtonElement> },
) => {
  const { ref, ...rest } = props;
  return <button ref={ref} {...rest} />;
};

const CreatedButtonLinkComponent = createLink(ButtonLinkComponent);

const ButtonLink: LinkComponent<typeof ButtonLinkComponent> = (props) => {
  return <CreatedButtonLinkComponent preload="intent" {...props} />
}
