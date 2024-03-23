
import type { AppProps } from "next/app";
import { AppCacheProvider } from '@mui/material-nextjs/v13-pagesRouter';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from "@mui/material";

const theme = createTheme();



export default function App(props:AppProps) {
    const { Component, pageProps } = props;
    return <AppCacheProvider {...props}>
      <ThemeProvider theme={theme}>
          <Component {...pageProps} />
          <CssBaseline />
      </ThemeProvider>
    </AppCacheProvider>
}
