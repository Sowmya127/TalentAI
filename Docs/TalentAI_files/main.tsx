const StrictMode = __vite__cjsImport0_react["StrictMode"];const createRoot = __vite__cjsImport1_reactDom_client["createRoot"];const _jsxDEV = __vite__cjsImport19_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=aca3ab98";
import __vite__cjsImport1_reactDom_client from "/node_modules/.vite/deps/react-dom_client.js?v=aca3ab98";
import { BrowserRouter } from "/node_modules/.vite/deps/react-router-dom.js?v=aca3ab98";
import { ThemeProvider } from "/node_modules/.vite/deps/@mui_material_styles.js?v=aca3ab98";
import CssBaseline from "/node_modules/.vite/deps/@mui_material_CssBaseline.js?v=aca3ab98";
import { LocalizationProvider } from "/node_modules/.vite/deps/@mui_x-date-pickers_LocalizationProvider.js?v=aca3ab98";
import { AdapterDayjs } from "/node_modules/.vite/deps/@mui_x-date-pickers_AdapterDayjs.js?v=aca3ab98";
import { QueryClientProvider } from "/node_modules/.vite/deps/@tanstack_react-query.js?v=aca3ab98";
import { SnackbarProvider } from "/node_modules/.vite/deps/notistack.js?v=aca3ab98";
import "/node_modules/@fontsource/inter/400.css";
import "/node_modules/@fontsource/inter/500.css";
import "/node_modules/@fontsource/inter/600.css";
import "/node_modules/@fontsource/inter/700.css";
import "/src/index.css";
import { theme } from "/src/theme/theme.ts";
import { queryClient } from "/src/config/queryClient.ts";
import { AuthProvider } from "/src/auth/AuthContext.tsx";
import { ErrorBoundary } from "/src/components/common/ErrorBoundary.tsx";
import App from "/src/App.tsx";
var _jsxFileName = "D:/TalentAI/Frontend/src/main.tsx";
import __vite__cjsImport19_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=aca3ab98";
createRoot(document.getElementById("root")).render(/* @__PURE__ */ _jsxDEV(StrictMode, { children: /* @__PURE__ */ _jsxDEV(BrowserRouter, { children: /* @__PURE__ */ _jsxDEV(QueryClientProvider, {
	client: queryClient,
	children: /* @__PURE__ */ _jsxDEV(ThemeProvider, {
		theme,
		children: [/* @__PURE__ */ _jsxDEV(CssBaseline, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 28,
			columnNumber: 11
		}, this), /* @__PURE__ */ _jsxDEV(LocalizationProvider, {
			dateAdapter: AdapterDayjs,
			children: /* @__PURE__ */ _jsxDEV(SnackbarProvider, {
				maxSnack: 3,
				anchorOrigin: {
					vertical: "bottom",
					horizontal: "right"
				},
				children: /* @__PURE__ */ _jsxDEV(ErrorBoundary, { children: /* @__PURE__ */ _jsxDEV(AuthProvider, { children: /* @__PURE__ */ _jsxDEV(App, {}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 33,
					columnNumber: 19
				}, this) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 32,
					columnNumber: 17
				}, this) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 31,
					columnNumber: 15
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 30,
				columnNumber: 13
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 29,
			columnNumber: 11
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 27,
		columnNumber: 9
	}, this)
}, void 0, false, {
	fileName: _jsxFileName,
	lineNumber: 26,
	columnNumber: 7
}, this) }, void 0, false, {
	fileName: _jsxFileName,
	lineNumber: 25,
	columnNumber: 5
}, this) }, void 0, false, {
	fileName: _jsxFileName,
	lineNumber: 24,
	columnNumber: 3
}, this));

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxxQkFBcUI7QUFDOUIsT0FBTyxpQkFBaUI7QUFDeEIsU0FBUyw0QkFBNEI7QUFDckMsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUywyQkFBMkI7QUFDcEMsU0FBUyx3QkFBd0I7QUFFakMsT0FBTztBQUNQLE9BQU87QUFDUCxPQUFPO0FBQ1AsT0FBTztBQUNQLE9BQU87QUFFUCxTQUFTLGFBQWE7QUFDdEIsU0FBUyxtQkFBbUI7QUFDNUIsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxxQkFBcUI7QUFDOUIsT0FBTyxTQUFTOzs7QUFFaEIsV0FBVyxTQUFTLGVBQWUsTUFBTSxDQUFFLENBQUMsQ0FBQyxPQUMzQyx3QkFBQyxZQUFELFlBQ0Usd0JBQUMsZUFBRCxZQUNFLHdCQUFDLHFCQUFEO0NBQXFCLFFBQVE7V0FDM0Isd0JBQUMsZUFBRDtFQUFzQjtZQUF0QixDQUNFLHdCQUFDLGFBQUQsQ0FBYzs7OztZQUNkLHdCQUFDLHNCQUFEO0dBQXNCLGFBQWE7YUFDakMsd0JBQUMsa0JBQUQ7SUFBa0IsVUFBVTtJQUFHLGNBQWM7S0FBRSxVQUFVO0tBQVUsWUFBWTtJQUFRO2NBQ3JGLHdCQUFDLGVBQUQsWUFDRSx3QkFBQyxjQUFELFlBQ0Usd0JBQUMsS0FBRCxDQUFNOzs7O2FBQ007Ozs7YUFDRDs7Ozs7R0FDQzs7Ozs7RUFDRTs7OztVQUNUOzs7Ozs7QUFDSTs7OztTQUNSOzs7O1NBQ0w7Ozs7UUFDZCIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJtYWluLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdHJpY3RNb2RlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBjcmVhdGVSb290IH0gZnJvbSAncmVhY3QtZG9tL2NsaWVudCdcbmltcG9ydCB7IEJyb3dzZXJSb3V0ZXIgfSBmcm9tICdyZWFjdC1yb3V0ZXItZG9tJ1xuaW1wb3J0IHsgVGhlbWVQcm92aWRlciB9IGZyb20gJ0BtdWkvbWF0ZXJpYWwvc3R5bGVzJ1xuaW1wb3J0IENzc0Jhc2VsaW5lIGZyb20gJ0BtdWkvbWF0ZXJpYWwvQ3NzQmFzZWxpbmUnXG5pbXBvcnQgeyBMb2NhbGl6YXRpb25Qcm92aWRlciB9IGZyb20gJ0BtdWkveC1kYXRlLXBpY2tlcnMvTG9jYWxpemF0aW9uUHJvdmlkZXInXG5pbXBvcnQgeyBBZGFwdGVyRGF5anMgfSBmcm9tICdAbXVpL3gtZGF0ZS1waWNrZXJzL0FkYXB0ZXJEYXlqcydcbmltcG9ydCB7IFF1ZXJ5Q2xpZW50UHJvdmlkZXIgfSBmcm9tICdAdGFuc3RhY2svcmVhY3QtcXVlcnknXG5pbXBvcnQgeyBTbmFja2JhclByb3ZpZGVyIH0gZnJvbSAnbm90aXN0YWNrJ1xuXG5pbXBvcnQgJ0Bmb250c291cmNlL2ludGVyLzQwMC5jc3MnXG5pbXBvcnQgJ0Bmb250c291cmNlL2ludGVyLzUwMC5jc3MnXG5pbXBvcnQgJ0Bmb250c291cmNlL2ludGVyLzYwMC5jc3MnXG5pbXBvcnQgJ0Bmb250c291cmNlL2ludGVyLzcwMC5jc3MnXG5pbXBvcnQgJy4vaW5kZXguY3NzJ1xuXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gJ0AvdGhlbWUvdGhlbWUnXG5pbXBvcnQgeyBxdWVyeUNsaWVudCB9IGZyb20gJ0AvY29uZmlnL3F1ZXJ5Q2xpZW50J1xuaW1wb3J0IHsgQXV0aFByb3ZpZGVyIH0gZnJvbSAnQC9hdXRoL0F1dGhDb250ZXh0J1xuaW1wb3J0IHsgRXJyb3JCb3VuZGFyeSB9IGZyb20gJ0AvY29tcG9uZW50cy9jb21tb24vRXJyb3JCb3VuZGFyeSdcbmltcG9ydCBBcHAgZnJvbSAnLi9BcHAudHN4J1xuXG5jcmVhdGVSb290KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb290JykhKS5yZW5kZXIoXG4gIDxTdHJpY3RNb2RlPlxuICAgIDxCcm93c2VyUm91dGVyPlxuICAgICAgPFF1ZXJ5Q2xpZW50UHJvdmlkZXIgY2xpZW50PXtxdWVyeUNsaWVudH0+XG4gICAgICAgIDxUaGVtZVByb3ZpZGVyIHRoZW1lPXt0aGVtZX0+XG4gICAgICAgICAgPENzc0Jhc2VsaW5lIC8+XG4gICAgICAgICAgPExvY2FsaXphdGlvblByb3ZpZGVyIGRhdGVBZGFwdGVyPXtBZGFwdGVyRGF5anN9PlxuICAgICAgICAgICAgPFNuYWNrYmFyUHJvdmlkZXIgbWF4U25hY2s9ezN9IGFuY2hvck9yaWdpbj17eyB2ZXJ0aWNhbDogJ2JvdHRvbScsIGhvcml6b250YWw6ICdyaWdodCcgfX0+XG4gICAgICAgICAgICAgIDxFcnJvckJvdW5kYXJ5PlxuICAgICAgICAgICAgICAgIDxBdXRoUHJvdmlkZXI+XG4gICAgICAgICAgICAgICAgICA8QXBwIC8+XG4gICAgICAgICAgICAgICAgPC9BdXRoUHJvdmlkZXI+XG4gICAgICAgICAgICAgIDwvRXJyb3JCb3VuZGFyeT5cbiAgICAgICAgICAgIDwvU25hY2tiYXJQcm92aWRlcj5cbiAgICAgICAgICA8L0xvY2FsaXphdGlvblByb3ZpZGVyPlxuICAgICAgICA8L1RoZW1lUHJvdmlkZXI+XG4gICAgICA8L1F1ZXJ5Q2xpZW50UHJvdmlkZXI+XG4gICAgPC9Ccm93c2VyUm91dGVyPlxuICA8L1N0cmljdE1vZGU+LFxuKVxuIl19