sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/m/MessageBox",
    "sap/viz/ui5/controls/VizFrame",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/controls/common/feeds/FeedItem",
    "sap/ui/core/Fragment",
], function (Controller, JSONModel, MessageToast, DateFormat, MessageBox, VizFrame, FlattenedDataset, FeedItem, Fragment) {
    "use strict";

    return Controller.extend("com.invertions.sapfiorimodinv.controller.investments.Investments", {

        _oResourceBundle: null,
        _bSidebarExpanded: true,
        _sSidebarOriginalSize: "380px",

        //Funcion Principal
        onInit: function () {

            // 1. Modelo para los símbolos (datos estáticos por ahora)
            this._initSymbolModel();
            // 2. Modelo para la tabla (vacío)
            this.getView().setModel(new JSONModel({
                value: []
            }), "priceData");

            // 3. Configurar gráfica
            this.getView().addEventDelegate({
                onAfterRendering: this._onViewAfterRendering.bind(this)
            });

            //FINANCIERO 
            this.getView().setModel(new JSONModel({
                expandedItems: {}
            }), "viewModel");

            // 2. Modelo para el historial (ajusta la ruta según tu estructura real)
            var oHistoryModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oHistoryModel, "historialModelo");

            this._loadFinacialHistory();



            //Selecciona la tabla
            var oViewModel = new sap.ui.model.json.JSONModel({
                selectedTab: "table"
            });
            this.getView().setModel(oViewModel, "viewModel");

            // Inicializar el modelo de análisis (Cambiar aqui para cambiar el panel de analisis de estrategia)
            var oStrategyAnalysisModelData = {
                balance: 1000,
                stock: 1,
                strategyKey: "",
                /*longSMA: 200,
                shortSMA: 50,*/
                startDate: null,
                endDate: null,
                controlsVisible: false,
                controlsVisibleMomentum: false,
                controlsVisibleSupertrend: false,
                controlsVisibleReversionSimple: false,
                strategies: [
                    { key: "", text: "Cargando textos..." },
                    { key: "MACrossover", text: "Cargando textos..." },
                    { key: "Momentum", text: "Cargando textos..." },
                    { key: "supertrend", text: "Cargando textos..." },
                    { key: "reversionSimple", text: "Cargando textos..." }
                ]
            };
            var oStrategyAnalysisModel = new JSONModel(oStrategyAnalysisModelData);
            this.getView().setModel(oStrategyAnalysisModel, "strategyAnalysisModel");


            // Modelo historial de inversiones



            // FIN Modelo historial de inversiones
            //Inicialización modelo de resultados
            var oStrategyResultModel = new JSONModel({
                hasResults: false,
                idSimulation: null,
                signal: null,
                date_from: null,
                date_to: null,
                moving_averages: { short: null, long: null },
                signals: [],
                chart_data: {},
                result: null
            });
            this.getView().setModel(oStrategyResultModel, "strategyResultModel");

            this._setDefaultDates();

            // Cargar el ResourceBundle
            var oI18nModel = this.getOwnerComponent().getModel("i18n");
            if (oI18nModel) {
                try {
                    var oResourceBundle = oI18nModel.getResourceBundle();
                    if (oResourceBundle && typeof oResourceBundle.getText === 'function') {
                        this._oResourceBundle = oResourceBundle;
                        //Modelo para el comboBox de estrategia
                        oStrategyAnalysisModel.setProperty("/strategies", [
                            { key: "", text: this._oResourceBundle.getText("selectStrategyPlaceholder") },
                            { key: "MACrossover", text: this._oResourceBundle.getText("movingAverageCrossoverStrategy") },
                            { key: "Momentum", text: this._oResourceBundle.getText("Momentum") },
                            { key: "supertrend", text: this._oResourceBundle.getText("supertrend") },
                            { key: "reversionSimple", text: this._oResourceBundle.getText("reversionSimple") },

                        ]);
                        console.log("Textos de i18n cargados correctamente.");
                    } else {
                        throw new Error("ResourceBundle no válido");
                    }
                } catch (error) {
                    console.error("Error al cargar ResourceBundle:", error);
                    oStrategyAnalysisModel.setProperty("/strategies", [
                        { key: "", text: "Error i18n: Seleccione..." },
                        { key: "MACrossover", text: "Error i18n: Cruce Medias..." }
                    ]);
                }
            } else {
                console.error("Modelo i18n no encontrado. Usando textos por defecto.");
                oStrategyAnalysisModel.setProperty("/strategies", [
                    { key: "", text: "No i18n: Seleccione..." },
                    { key: "MACrossover", text: "No i18n: Cruce Medias..." }
                ]);
            }

            // Para el tamaño del Sidebar
            var oSidebarLayoutData = this.byId("sidebarLayoutData");
            if (oSidebarLayoutData) {
                this._sSidebarOriginalSize = oSidebarLayoutData.getSize();
            } else {
                var oSidebarVBox = this.byId("sidebarVBox");
                if (oSidebarVBox && oSidebarVBox.getLayoutData()) {
                    this._sSidebarOriginalSize = oSidebarVBox.getLayoutData().getSize();
                }
            }
            const oAppModel = this.getOwnerComponent().getModel("appView");
            const userId = oAppModel.getProperty("/userId");
            this._loadHistoryModel(userId);
            console.log(userId + 'afuera');

        },
        //Fin funcion principal

        //Cargar historial
        _loadHistoryModel: async function (userId) {
            const oHistoryModel = new JSONModel();
            this.getView().setModel(oHistoryModel, "historyModel");

            //recuperar el usuario logeado

            console.log(userId + 'historial');

            const params = new URLSearchParams({
                procedure: "getall",
                RegUser: `${userId}`
            });

            try {
                const url = `http://localhost:4004/api/inv/simulationCrud?${params.toString()}`;
                const response = await fetch(url, { method: "POST" });
                const data = await response.json();

                // Validación por si viene en .value
                const rawData = data.value || data;

                const transformedStrategies = rawData.map(item => {
                    return {
                        date: item.ENDDATE ? new Date(item.ENDDATE) : null,
                        strategyName: item.SIMULATIONNAME || "Sin nombre",
                        symbol: item.SYMBOL || "",
                        result: item.SUMMARY?.FINAL_BALANCE ?? 0,
                        status: item.SUMMARY?.FINAL_BALANCE >= 0 ? "Completado" : "En Proceso",
                        _fullRecord: item // por si luego necesitas volver a cargar todo
                    };
                });

                oHistoryModel.setData({
                    strategies: transformedStrategies,
                    filteredCount: transformedStrategies.length,
                    selectedCount: 0,
                    filters: {
                        dateRange: null,
                        investmentRange: [0, 10000],
                        profitRange: [-100, 100]
                    }
                });

            } catch (err) {
                console.error("Error al cargar historial de estrategias:", err);
                oHistoryModel.setData({
                    strategies: [],
                    filteredCount: 0,
                    selectedCount: 0,
                    filters: {
                        dateRange: null,
                        investmentRange: [0, 10000],
                        profitRange: [-100, 100]
                    }
                });
            }
        },


        //Navega entre prestañas tabla o grafica
        onTabSelect: function (oEvent) {
            var sKey = oEvent.getParameter("key");
            this.getView().getModel("viewModel").setProperty("/selectedTab", sKey);
        },

        //Renderiza la grafica
        _onViewAfterRendering: function () {
            this._configureChart();
        },

        //Carga los simbolos en el comboBox
        _initSymbolModel: function () {
            const oSymbolModel = new JSONModel();

            fetch("http://localhost:4004/api/inv/company")
                .then(response => response.json())
                .then(data => {
                    const processedData = data.value.map(item => ({
                        symbol: item.symbol,
                        name: item.name
                    }));

                    oSymbolModel.setData({
                        selectedSymbol: "TSLA", // valor por defecto
                        symbols: processedData
                    });
                })

            /*  oSymbolModel.setData({
                 selectedSymbol: "TSLA", // valor por defecto
                 symbols: [
                     { symbol: "TSLA", name: "Tesla" },
                     { symbol: "AAPL", name: "Apple" },
                     { symbol: "MSFT", name: "Microsoft" },
                     { symbol: "XXXX", name: "Microsoft" }
                 ]
             }); */
            this.getView().setModel(oSymbolModel, "symbolModel");

        },


        onSymbolSelectionChange: async function (oEvent) {
            const sSelectedSymbol = oEvent.getParameter("selectedItem").getKey();
            this.getView().getModel("symbolModel").setProperty("/selectedSymbol", sSelectedSymbol);
            console.log(sSelectedSymbol);

            try {
                const response = await fetch(`http://localhost:4004/api/inv/priceshistorycrud?procedure=GET&type=ALPHA&symbol=${sSelectedSymbol}`, {
                    method: 'POST'
                });
                const res = await response.json();
                const aData = res?.value?.[0]?.data || [];
                console.log("asdsadasdasd", aData);
                this._loadTableDataBySymbol(aData); // <--- Aquí se pasa la data

            } catch (e) {
                console.error("Error al obtener datos del símbolo:", e);
                this._loadTableDataBySymbol([]);
            }
        },


        formatProfitState: function (profit) {
            return profit > 0 ? "Success" : (profit < 0 ? "Error" : "None");
        },

        onToggleDetails: function (oEvent) {
            const oSource = oEvent.getSource();
            const oBindingContext = oSource.getBindingContext();
            const sSimulationId = oBindingContext.getObject().SIMULATIONID;
            const oViewModel = this.getView().getModel("viewModel");
            const oExpandedItems = oViewModel.getProperty("/expandedItems") || {};

            // Toggle estado
            oExpandedItems[sSimulationId] = !oExpandedItems[sSimulationId];

            // Actualizar modelo
            oViewModel.setProperty("/expandedItems", oExpandedItems);
        },

        getArrowIcon: function (expandedItems) {
            const sSimulationId = this.getBindingContext().getObject().SIMULATIONID;
            return expandedItems[sSimulationId] ? "sap-icon://navigation-down-arrow" : "sap-icon://navigation-right-arrow";
        },

        //Cargar los datos en la tabla

        _loadTableDataBySymbol: function (aApiData) {
            const oResultModel = this.getView().getModel("strategyResultModel");

            if (Array.isArray(aApiData)) {
                // Formatear fechas
                const dataWithFormattedDates = aApiData.map(item => ({
                    ...item,
                    DATE: item.DATE ? item.DATE.substring(0, 10) : "",
                    DATE_GRAPH: item.DATE ? item.DATE.substring(0, 10) : "",
                    BUY_SIGNAL: item.BUY_SIGNAL ? item.BUY_SIGNAL : "",
                    SELL_SIGNAL: item.SELL_SIGNAL ? item.SELL_SIGNAL : "",

                }));

                const aPreparedData = this._prepareTableData(dataWithFormattedDates);
                oResultModel.setProperty("/chart_data", aPreparedData);

                this._addVizMeasures(dataWithFormattedDates);

            } else {
                oResultModel.setProperty("/chart_data", []);
            }
        },


        //Añadir lineas a la grafica
        _addVizMeasures: function (aData) {
            console.log(aData);

            //  Preprocesar: convertir INDICATORS[] en propiedades directas
            aData.forEach(dayItem => {
                (dayItem.INDICATORS || []).forEach(ind => {
                    const key = ind.INDICATOR.toUpperCase();
                    dayItem[key] = ind.VALUE;
                });
            });

            const oVizFrame = this.byId("idVizFrame");
            const oDataset = oVizFrame.getDataset();

            //  Limpia medidas y feeds existentes
            oDataset.removeAllMeasures();
            oVizFrame.removeAllFeeds();

            // 📈 Definir medidas dinámicas según los datos
            const aMeasures = [];

            // Precio de cierre (siempre)
            aMeasures.push(new sap.viz.ui5.data.MeasureDefinition({
                name: "PrecioCierre",
                value: "{strategyResultModel>CLOSE}"
            }));

            // Agregar indicadores si existen
            if ("SHORT_MA" in aData[0]) {
                aMeasures.push(new sap.viz.ui5.data.MeasureDefinition({
                    name: "ShortMA",
                    value: "{strategyResultModel>SHORT_MA}"
                }));
            }

            if ("LONG_MA" in aData[0]) {
                aMeasures.push(new sap.viz.ui5.data.MeasureDefinition({
                    name: "LongMA",
                    value: "{strategyResultModel>LONG_MA}"
                }));
            }

            if ("RSI" in aData[0]) {
                aMeasures.push(new sap.viz.ui5.data.MeasureDefinition({
                    name: "RSI",
                    value: "{strategyResultModel>RSI}"
                }));
            }

            if ("ADX" in aData[0]) {
                aMeasures.push(new sap.viz.ui5.data.MeasureDefinition({
                    name: "ADX",
                    value: "{strategyResultModel>ADX}"
                }));
            }

            if ("MA" in aData[0]) {
                aMeasures.push(new sap.viz.ui5.data.MeasureDefinition({
                    name: "MA",
                    value: "{strategyResultModel>MA}"
                }));
            }

            if ("ATR" in aData[0]) {
                aMeasures.push(new sap.viz.ui5.data.MeasureDefinition({
                    name: "ATR",
                    value: "{strategyResultModel>ATR}"
                }));
            }
            if ("SMA" in aData[0]) {
                aMeasures.push(new sap.viz.ui5.data.MeasureDefinition({
                    name: "SMA",
                    value: "{strategyResultModel>SMA}"
                }));
            }

            // Señales de compra/venta (opcional, si las agregas como números)
            if ("BUY_SIGNAL" in aData[0]) {
                aMeasures.push(new sap.viz.ui5.data.MeasureDefinition({
                    name: "Señal BUY",
                    value: "{strategyResultModel>BUY_SIGNAL}"
                }));
            }

            if ("SELL_SIGNAL" in aData[0]) {
                aMeasures.push(new sap.viz.ui5.data.MeasureDefinition({
                    name: "Señal SELL",
                    value: "{strategyResultModel>SELL_SIGNAL}"
                }));
            }

            // 📌 Agrega todas las medidas al dataset
            aMeasures.forEach(oMeasure => oDataset.addMeasure(oMeasure));

            // 📊 Feeds para ejes
            const oFeedValueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
                uid: "valueAxis",
                type: "Measure",
                values: aMeasures.map(m => m.getName())
            });

            const oFeedTimeAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
                uid: "timeAxis",
                type: "Dimension",
                values: ["Fecha"]
            });

            oVizFrame.addFeed(oFeedTimeAxis);
            oVizFrame.addFeed(oFeedValueAxis);
            //AQUIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
        },



        //Acomoda los datos de la API
        _transformDataForVizFrame: function (aApiData) {
            if (!aApiData || !Array.isArray(aApiData)) {
                return [];
            }
            return aApiData.map(oItem => {
                let dateValue = oItem.DATE || oItem.date;

                let closeValue = parseFloat(oItem.CLOSE || oItem.close);
                if (isNaN(closeValue)) closeValue = null;

                return {
                    DATE: dateValue,
                    OPEN: parseFloat(oItem.OPEN) || null,
                    HIGH: parseFloat(oItem.HIGH) || null,
                    LOW: parseFloat(oItem.LOW) || null,
                    CLOSE: closeValue,
                    VOLUME: parseFloat(oItem.VOLUME) || null,
                };
            });
        },

        _configureChart: function () {
            const oVizFrame = this.byId("idVizFrame");
            if (!oVizFrame) {
                console.warn("Función _configureChart: VizFrame con ID 'idVizFrame' no encontrado en este punto del ciclo de vida.");
                return;
            }

            oVizFrame.setVizProperties({
                plotArea: {
                    dataLabel: { visible: true },
                    window: {
                        start: null,
                        end: null
                    }
                },
                valueAxis: {
                    title: { text: "Precio de Cierre (USD)" }
                },
                timeAxis: {
                    title: { text: "Fecha" },
                    levels: ["day", "month", "year"],
                    label: {
                        formatString: "dd/MM/yy"
                    }
                },
                title: {
                    text: "Histórico de Precios de Acciones"
                },
                legend: {
                    visible: true
                },
                toolTip: {
                    visible: true,
                    formatString: "#,##0.00"
                },
                interaction: {
                    zoom: {
                        enablement: "enabled"
                    },
                    selectability: {
                        mode: "single"
                    }
                }
            });
            console.log("Propiedades de VizFrame configuradas para permitir zoom.");
        },



        // PANEL DE ESTRATEGIAS
        _setDefaultDates: function () {
            var oStrategyAnalysisModel = this.getView().getModel("strategyAnalysisModel");
            var oToday = new Date();
            oStrategyAnalysisModel.setProperty("/endDate", new Date(oToday));
            var oStartDate = new Date(oToday);
            oStartDate.setMonth(oStartDate.getMonth() - 6);
            oStrategyAnalysisModel.setProperty("/startDate", new Date(oStartDate));
        },

        onStrategyChange: function (oEvent) {
            var oStrategyAnalysisModel = this.getView().getModel("strategyAnalysisModel");
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey();

            oStrategyAnalysisModel.setProperty("/controlsVisible", sSelectedKey === "MACrossover");
            oStrategyAnalysisModel.setProperty("/controlsVisibleMomentum", sSelectedKey === "Momentum");
            oStrategyAnalysisModel.setProperty("/controlsVisibleReversionSimple", sSelectedKey === "reversionSimple");
            oStrategyAnalysisModel.setProperty("/controlsVisibleSupertrend", sSelectedKey === "supertrend");
        },


        //Aqui se ejecuta todo lo de la API de simulacion
        onRunAnalysisPress: function () {
            var oView = this.getView();
            var oStrategyModel = oView.getModel("strategyAnalysisModel");
            var oResultModel = oView.getModel("strategyResultModel");
            var oAnalysisPanel = this.byId("strategyAnalysisPanelTable")?.byId("strategyAnalysisPanel") ||
                this.byId("strategyAnalysisPanelChart")?.byId("strategyAnalysisPanel");
            var oResultPanel = this.byId("strategyResultPanel") || sap.ui.core.Fragment.byId("strategyResultPanel");
            var sSymbol = oView.byId("symbolSelector").getSelectedKey();

            //buscar al usuario
            const oAppModel = this.getOwnerComponent().getModel("appView");
            const userId = oAppModel.getProperty("/userId");

            // Validaciones básicas
            if (!oStrategyModel.getProperty("/strategyKey")) {
                MessageBox.warning("Seleccione una estrategia");
                return;
            }

            if (!sSymbol) {
                MessageBox.warning("Seleccione un símbolo (ej: AAPL)");
                return;
            }

            if (oAnalysisPanel) {
                oAnalysisPanel.setExpanded(false);
            }
            // Expande el panel de resultados
            if (oResultPanel) {
                oResultPanel.setExpanded(true);
            }
            let oRequestBody = {};
            let aSpecs = [];
            let sStrategy;


            if (oStrategyModel.getProperty("/strategyKey") === "Momentum") {
                sStrategy = "momentum";
                aSpecs = [
                    { INDICATOR: "LONG", VALUE: oStrategyModel.getProperty("/longEMA") },
                    { INDICATOR: "SHORT", VALUE: oStrategyModel.getProperty("/shortEMA") },
                    { INDICATOR: "ADX", VALUE: oStrategyModel.getProperty("/adx") },
                    { INDICATOR: "RSI", VALUE: oStrategyModel.getProperty("/rsi") }
                ];

            }

            if (oStrategyModel.getProperty("/strategyKey") === "reversionSimple") {
                sStrategy = "reversionsimple";
                aSpecs = [

                    { INDICATOR: "rsi", VALUE: oStrategyModel.getProperty("/rsia") }
                ];
            }

            if (oStrategyModel.getProperty("/strategyKey") === "MACrossover") {
                sStrategy = "macrossover";
                aSpecs = [

                    { INDICATOR: "SHORT_MA", VALUE: oStrategyModel.getProperty("/shortSMA") },
                    { INDICATOR: "LONG_MA", VALUE: oStrategyModel.getProperty("/longSMA") }
                ];
            }

            if (oStrategyModel.getProperty("/strategyKey") === "supertrend") {
                sStrategy = "supertrend";
                aSpecs = [

                    { INDICATOR: "ma_length", VALUE: oStrategyModel.getProperty("/ma_length") },
                    { INDICATOR: "atr", VALUE: oStrategyModel.getProperty("/atr") },
                    { INDICATOR: "mult", VALUE: oStrategyModel.getProperty("/mult") },
                    { INDICATOR: "rr", VALUE: oStrategyModel.getProperty("/rr") }
                ];
            }

            oRequestBody = {
                "SIMULATION": {
                    SYMBOL: sSymbol,
                    STARTDATE: this._formatDate(oStrategyModel.getProperty("/startDate")),
                    ENDDATE: this._formatDate(oStrategyModel.getProperty("/endDate")),
                    AMOUNT: parseInt(oStrategyModel.getProperty("/stock")),
                    USERID: `${userId}`,
                    SPECS: aSpecs
                }
            };

            if (!sStrategy) {
                console.warn("Error.");
            }


            fetch(`http://localhost:4004/api/inv/simulation?strategy=${sStrategy}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(oRequestBody)
            })
                .then(response => {
                    if (!response.ok) {
                        return Promise.reject(new Error(`HTTP error! Status: ${response.status}`));
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Datos recibidos:", data);

                    try {
                        let aData = {};
                        if (oStrategyModel.getProperty("/strategyKey") === "Momentum") {
                            aData = data?.value?.[0]?.simulacion;
                        }
                        if (oStrategyModel.getProperty("/strategyKey") === "supertrend") {
                            aData = data?.value?.[0]?.simulacion;
                        }
                        if (oStrategyModel.getProperty("/strategyKey") === "reversionSimple") {
                            aData = data?.value?.[0]?.simulation;
                        }
                        if (oStrategyModel.getProperty("/strategyKey") === "MACrossover") {
                            aData = data?.value?.[0];
                            console.log("mascrossover", aData);
                        }

                        const signalsByDate = {};
                        (aData.SIGNALS || []).forEach(signal => {
                            const dateKey = signal.DATE?.substring(0, 10);
                            if (dateKey) {
                                if (!signalsByDate[dateKey]) {
                                    signalsByDate[dateKey] = [];
                                }
                                signalsByDate[dateKey].push(signal);
                            }
                        });

                        // Procesar CHART_DATA, añadiendo señales agrupadas por día
                        const chartDataProcessed = (aData.CHART_DATA || []).map(item => {
                            const dateKey = item.DATE?.substring(0, 10);
                            const signalsForDay = signalsByDate[dateKey] || [];

                            // Si hay señales para ese día, concatenar los campos en arrays
                            const rules = signalsForDay.map(s => s.REASONING);
                            const signals = signalsForDay.map(s => s.TYPE);
                            const shares = signalsForDay.map(s => s.SHARES);

                            return {

                                DATE: dateKey,
                                OPEN: item.OPEN,
                                HIGH: item.HIGH,
                                LOW: item.LOW,
                                CLOSE: item.CLOSE,
                                VOLUME: item.VOLUME,
                                INDICATORS: item.INDICATORS,
                                RULES: rules.length > 0 ? rules : [""],
                                SIGNALS: signals.length > 0 ? signals : [""],
                                SHARES: shares.length > 0 ? shares : [0]
                            };
                        }).reverse(); // Mostrar desde la fecha más antigua
                        console.log("aaa", chartDataProcessed);
                        oResultModel.setProperty("/simulationName", aData.SIMULATIONNAME);
                        oResultModel.setProperty("/symbol", aData.SYMBOL);
                        oResultModel.setProperty("/startDate", aData.STARTDATE);
                        oResultModel.setProperty("/endDate", aData.ENDDATE);

                        //pa que jale otra vez
                        this._loadHistoryModel(userId);

                        const oSummary = aData.SUMMARY;
                        oResultModel.setProperty("/FINAL_BALANCE", oSummary.FINAL_BALANCE);
                        oResultModel.setProperty("/FINAL_CASH", oSummary.FINAL_CASH);
                        oResultModel.setProperty("/FINAL_VALUE", oSummary.FINAL_VALUE);
                        oResultModel.setProperty("/REAL_PROFIT", oSummary.REAL_PROFIT);
                        oResultModel.setProperty("/REMAINING_UNITS", oSummary.REMAINING_UNITS);
                        oResultModel.setProperty("/TOTAL_BOUGHT_UNITS", oSummary.TOTAL_BOUGHT_UNITS);
                        oResultModel.setProperty("/TOTAL_SOLD_UNITS", oSummary.TOTAL_SOLDUNITS); // ojo con nombre diferente
                        oResultModel.setProperty("/PERCENTAGE_RETURN", oSummary.PERCENTAGE_RETURN);
                        //pueba 
                        this._loadTableDataBySymbol(chartDataProcessed);

                    } catch (e) {
                        console.error("Error al obtener datos del símbolo:", e);
                        this._loadTableDataBySymbol([]);
                    }
                })
                .catch(error => {
                    console.error("Error en la solicitud:", error);
                    this._loadTableDataBySymbol([]);  // Si falla la llamada, cargas datos vacíos
                });

        },
        //Fin de todo lo de la API de simulacion

        /*HISTORIAL FINANCIERO---------------------------------------------------------------------------------------------------- */
        _loadFinacialHistory: function () {

            const oAppModel = this.getOwnerComponent().getModel("appView");
            const userId = oAppModel.getProperty("/userId");

            fetch(`http://localhost:4004/api/inv/history?userId=${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Error en la solicitud: " + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Datos recibidos:", data.value[0]?.HISTORY);
                    this.getView().getModel("historialModelo").setData({"HISTORY":data.value[0]?.HISTORY});
                    this._filterKeySimulations();
                    console.log("Datos en historialModelo:", this.getView().getModel("historialModelo").getData());
                })
                .catch(error => {
                    console.error("Error al buscar historial:", error);
                });

        },

        _filterKeySimulations: function () {
            var aHistory = this.getView().getModel("historialModelo").getProperty("/HISTORY") || [];
            var aFiltered = [];

            if (aHistory.length >= 3) {
                aFiltered = [aHistory[0], aHistory[aHistory.length - 2], aHistory[aHistory.length - 1]];
            } else if (aHistory.length === 2) {
                aFiltered = [aHistory[0], aHistory[1]];
            } else if (aHistory.length === 1) {
                aFiltered = [aHistory[0]];
            }

            this.getView().getModel("historialModelo").setData({"HISTORY":aFiltered});
        },


        formatSimulationDate: function (dateString) {
            if (!dateString) return "";
            try {
                var oDateFormat = DateFormat.getDateInstance({
                    pattern: "MMM d, yyyy"
                });
                return oDateFormat.format(new Date(dateString));
            } catch (error) {
                console.error("Error formateando fecha:", error);
                return dateString;
            }
        },

        // Función para estado de ganancia (renombrable)
        getProfitState: function (profit) {
            if (profit === undefined || profit === null) return "None";
            return profit > 0 ? "Success" : (profit < 0 ? "Error" : "None");
        },




        /*FIN HISRTOTIAL ----------------------------------------------------------------------------------------------------------*/
        // Función auxiliar para formatear fechas
        _formatDate: function (oDate) {
            return oDate ? DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }).format(oDate) : null;
        },


        // Función auxiliar para preparar datos para la tabla LLENA LA TABLA, pero maneja todo
        _prepareTableData: function (aData) {
            if (!Array.isArray(aData)) return [];

            return aData.map(oItem => {

                let shortMValue = null;
                let longMValue = null;
                let rsiValue = null;
                let adxValue = null;
                let maValue = null;
                let atrValue = null;
                let smaValue = null;

                if (Array.isArray(oItem.INDICATORS)) {
                    oItem.INDICATORS.forEach(ind => {
                        switch (ind.INDICATOR) {
                            case "short_ma":
                                shortMValue = ind.VALUE;
                                break;
                            case "long_ma":
                                longMValue = ind.VALUE;
                                break;
                            case "adx":
                                adxValue = ind.VALUE;
                                break;
                            case "rsi":
                                rsiValue = ind.VALUE;
                                break;
                            case "ma":
                                maValue = ind.VALUE;
                                break;
                            case "atr":
                                atrValue = ind.VALUE;
                                break;
                            case "sma":
                                smaValue = ind.VALUE;
                                break;
                        }
                    });
                }
                const dateIso = oItem.DATE || oItem.date; // puede ser uppercase o lowercase según el backend

                return {
                    DATE: dateIso?.substring(0, 10), // para la tabla (YYYY-MM-DD)
                    DATE_GRAPH: new Date(dateIso),   // para el gráfico (objeto Date)
                    OPEN: oItem.OPEN ?? oItem.open,
                    HIGH: oItem.HIGH ?? oItem.high,
                    LOW: oItem.LOW ?? oItem.low,
                    CLOSE: oItem.CLOSE ?? oItem.close,
                    VOLUME: oItem.VOLUME ?? oItem.volume,
                    SHORT_MA: oItem.SHORT_MA ?? shortMValue,
                    LONG_MA: oItem.LONG_MA ?? longMValue,
                    ADX: oItem.ADX ?? adxValue,
                    RSI: oItem.RSI ?? rsiValue,
                    MA: oItem.ADX ?? maValue,
                    ATR: oItem.RSI ?? atrValue,
                    SMA: oItem.RSI ?? smaValue,
                    INDICATORS: Array.isArray(oItem.INDICATORS)
                        ? oItem.INDICATORS.map(ind => `${ind.INDICATOR}: ${ind.VALUE.toFixed(2)}`).join(", ")
                        : "",
                    SIGNALS: oItem.SIGNALS,
                    RULES: oItem.RULES,
                    SHARES: oItem.SHARES,
                    BUY_SIGNAL: oItem.SIGNALS?.[0] === "buy" ? oItem.CLOSE : null,
                    SELL_SIGNAL: oItem.SIGNALS?.[0] === "sell" ? oItem.CLOSE : null,
                };
            });
        },


        onRefreshChart: function () {
            const oSymbolModel = this.getView().getModel("symbolModel");
            const sCurrentSymbol = oSymbolModel.getProperty("/selectedSymbol");

            if (sCurrentSymbol) {
                // Refresca los datos de la tabla y el gráfico
                this._loadPriceData(sCurrentSymbol);
            } else {
                const aSymbols = oSymbolModel.getProperty("/symbols");
                if (aSymbols && aSymbols.length > 0) {
                    const sDefaultSymbol = aSymbols[0].symbol;
                    oSymbolModel.setProperty("/selectedSymbol", sDefaultSymbol);
                    this._loadPriceData(sDefaultSymbol);
                } else {
                    MessageToast.show("Por favor, seleccione un símbolo.");
                }
            }
        },

        onDataPointSelect: function (oEvent) {
            const oData = oEvent.getParameter("data");
            console.log("Datos seleccionados:", oData);

            if (oData && oData.length > 0) {
                const oSelectedData = oData[0];
                console.log("Datos del punto seleccionado:", oSelectedData);

                const sFecha = oSelectedData.data.DATE;
                const fPrecioCierre = oSelectedData.data.CLOSE;

                if (sFecha && fPrecioCierre !== undefined) {
                    const oViewModel = this.getView().getModel("viewModel");
                    oViewModel.setProperty("/selectedPoint", {
                        DATE: sFecha,
                        CLOSE: fPrecioCierre
                    });
                } else {
                    console.warn("Los datos seleccionados no contienen DATE o CLOSE.");
                }
            } else {
                console.warn("No se seleccionaron datos.");
            }
        },

        //Historial de inversiones
        onHistoryPress: function (oEvent) {
            if (!this._oHistoryPopover) {
                this._oHistoryPopover = sap.ui.xmlfragment(
                    "myFragmentId", // Asignas un id para el fragmento
                    "com.invertions.sapfiorimodinv.view.investments.fragments.InvestmentHistoryPanel",
                    this
                );
                this.getView().addDependent(this._oHistoryPopover);
            }

            if (this._oHistoryPopover.isOpen()) {
                this._oHistoryPopover.close();
                return;
            }

            this._oHistoryPopover.openBy(oEvent.getSource());
        },
        //OBTIENE EL HISTORIAL PASADO BASARSE EN ESTE PARA HACER EL POST
        onLoadStrategy: function () {
            const oTable = sap.ui.core.Fragment.byId("myFragmentId", "historyTable");
            const oSelectedItem = oTable.getSelectedItem();

            if (!oSelectedItem) {
                sap.m.MessageToast.show("Por favor selecciona una estrategia antes de cargar.");
                return;
            }

            const oContext = oSelectedItem.getBindingContext("historyModel");
            const oData = oContext.getObject();
            const fullRecord = oData._fullRecord;
            console.log("aasdsadsadsa", fullRecord);
            // Agrupar señales por fecha
            const signalsByDate = {};
            (fullRecord.SIGNALS || []).forEach(signal => {
                const dateKey = signal.DATE?.substring(0, 10);
                if (dateKey) {
                    if (!signalsByDate[dateKey]) {
                        signalsByDate[dateKey] = [];
                    }
                    signalsByDate[dateKey].push(signal);
                }
            });

            // Procesar CHART_DATA, añadiendo señales agrupadas por día
            const chartDataProcessed = (fullRecord.CHART_DATA || []).map(item => {
                const dateKey = item.DATE?.substring(0, 10);
                const signalsForDay = signalsByDate[dateKey] || [];

                // Si hay señales para ese día, concatenar los campos en arrays
                const rules = signalsForDay.map(s => s.REASONING);
                const signals = signalsForDay.map(s => s.TYPE);
                const shares = signalsForDay.map(s => s.SHARES);

                return {

                    DATE: dateKey,
                    OPEN: item.OPEN,
                    HIGH: item.HIGH,
                    LOW: item.LOW,
                    CLOSE: item.CLOSE,
                    VOLUME: item.VOLUME,
                    INDICATORS: item.INDICATORS,
                    RULES: rules.length > 0 ? rules : [""],
                    SIGNALS: signals.length > 0 ? signals : [""],
                    SHARES: shares.length > 0 ? shares : [0]
                };
            }).reverse(); // Mostrar desde la fecha más antigua

            // Pasar datos al método que carga la tabla y gráfico
            this._loadTableDataBySymbol(chartDataProcessed);
            console.log("Señales", chartDataProcessed);
            // Para el modelo de resultados también mandamos todas las señales planas invertidas
            const simplifiedSignals = Object.values(signalsByDate).flat().reverse();
            const oResultModel = this.getView().getModel("strategyResultModel");
            oResultModel.setProperty("/signals", simplifiedSignals);
            //Aqui ponemos todo lo de resumen
            oResultModel.setProperty("/simulationName", fullRecord.SIMULATIONNAME);
            oResultModel.setProperty("/symbol", fullRecord.SYMBOL);
            oResultModel.setProperty("/startDate", fullRecord.STARTDATE);
            oResultModel.setProperty("/endDate", fullRecord.ENDDATE);


            const oSummary = fullRecord.SUMMARY;
            oResultModel.setProperty("/FINAL_BALANCE", oSummary.FINAL_BALANCE);
            oResultModel.setProperty("/FINAL_CASH", oSummary.FINAL_CASH);
            oResultModel.setProperty("/FINAL_VALUE", oSummary.FINAL_VALUE);
            oResultModel.setProperty("/REAL_PROFIT", oSummary.REAL_PROFIT);
            oResultModel.setProperty("/REMAINING_UNITS", oSummary.REMAINING_UNITS);
            oResultModel.setProperty("/TOTAL_BOUGHT_UNITS", oSummary.TOTAL_BOUGHT_UNITS);
            oResultModel.setProperty("/TOTAL_SOLD_UNITS", oSummary.TOTAL_SOLDUNITS); // ojo con nombre diferente
            oResultModel.setProperty("/PERCENTAGE_RETURN", oSummary.PERCENTAGE_RETURN)
        },


        // ******** FILTRO ********** //
        onToggleAdvancedFilters: function () {
            if (!this._oHistoryPopover) return;

            // Get panel directly from popover content
            const oPanel = sap.ui.getCore().byId("advancedFiltersPanel");

            if (oPanel) {
                oPanel.setVisible(!oPanel.getVisible());
            } else {
                console.warn("Advanced filters panel not found");
            }
        },



    });
});