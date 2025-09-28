import { createFileRoute } from "@tanstack/react-router";
import Header from "@/components/Header";
import logo from "../logo.svg";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <>
      <Header />
      <h1>Hello World!</h1>
      <img src={logo} width="100px" alt="logo" />
    </>
  );
}
