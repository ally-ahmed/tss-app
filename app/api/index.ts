import { createRouter, defineEventHandler } from "vinxi/http";


const router = createRouter();
router.get(
  "/",
  defineEventHandler((event) => {
    return { message: "Tadaa!" };
  }),
);
router.get(
  "/callback/github",
  defineEventHandler((event) => {
    return { message: "Github Callback!" };
  }),
)

export default router.handler