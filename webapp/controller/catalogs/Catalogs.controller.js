sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "jquery",
  ],
  function (Controller, JSONModel, MessageBox, Fragment, MessageToast, $) {
    "use strict";

    return Controller.extend(
      "com.invertions.sapfiorimodinv.controller.catalogs.Catalogs",
      {
        // ---------------------------------------------------- INICIO DE LA VISTA

        onInit: function () {
          var oModel = new JSONModel();
          var that = this;

          this._oDialog = null;

          fetch("http://localhost:4004/api/sec/labelCRUD?procedure=getall", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error("Error en la respuesta del servidor");
              }
              return response.json();
            })
            .then((data) => {
              oModel.setData({ value: data.value });
              that.getView().setModel(oModel);
            })
            .catch((error) => {
              console.error("Error en la petición fetch:", error);
            });
        },

        // ---------------------------------------------------- PARA FILTRAR EN LA TABLA

        onFilterChange: function (oEvent) {
          var sQuery = oEvent.getSource().getValue();
          var oTable = this.byId("catalogTable");
          var aItems = oTable.getItems();

          if (!sQuery) {
            aItems.forEach(function (oItem) {
              oItem.setVisible(true);
            });
            return;
          }

          aItems.forEach(function (oItem) {
            var oContext = oItem.getBindingContext();
            if (!oContext) return;

            var oData = oContext.getObject();
            var bVisible = Object.keys(oData).some(function (sKey) {
              var value = oData[sKey];

              if (typeof value === "string") {
                return value.toLowerCase().includes(sQuery.toLowerCase());
              } else if (typeof value === "number") {
                return value.toString().includes(sQuery);
              }

              return false;
            });

            oItem.setVisible(bVisible);
          });
        },

        // ---------------------------------------------------- PARA AGREGAR UN NUEVO LABEL

        onAddCatalog: function () {
          // Inicializa el modelo con estructura completa
          var oModel = new JSONModel({
            COMPANYID: "0",
            CEDIID: "0",
            LABELID: "",
            LABEL: "",
            INDEX: "",
            COLLECTION: "",
            SECTION: "seguridad",
            SEQUENCE: 10,
            IMAGE: "",
            DESCRIPTION: "",
            DETAIL_ROW: {
              ACTIVED: true,
              DELETED: false,
              DETAIL_ROW_REG: [
                {
                  CURRENT: false,
                  REGDATE: new Date().toISOString(),
                  REGTIME: new Date().toISOString(),
                  REGUSER: "FIBARRAC",
                },
                {
                  CURRENT: true,
                  REGDATE: new Date().toISOString(),
                  REGTIME: new Date().toISOString(),
                  REGUSER: "FIBARRAC",
                },
              ],
            },
          });

          this.getView().setModel(oModel, "addCatalogModel");

          // Cargar el diálogo si no existe
          if (!this._oAddDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: "com.invertions.sapfiorimodinv.view.catalogs.fragments.AddCatalogDialog",
              controller: this,
            }).then(
              function (oDialog) {
                this._oAddDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
              }.bind(this)
            );
          } else {
            this._oAddDialog.open();
          }
        },

        onSaveCatalog: function () {
          var oModel = this.getView().getModel("addCatalogModel");
          var oData = oModel.getData();

          // Obtener el modelo de la tabla
          var oTableModel = this.getView().getModel();
          var aData = oTableModel.getProperty("/value") || [];

          // Validación básica
          if (!oData.LABELID || !oData.LABEL) {
            MessageToast.show("LABELID y LABEL son campos requeridos");
            return;
          }

          // Verificar si el LABELID ya existe
          var bLabelIdExists = aData.some(function (item) {
            return item.LABELID === oData.LABELID;
          });

          if (bLabelIdExists) {
            MessageToast.show(
              "El LABELID ya existe, por favor ingrese uno diferente"
            );
            return;
          }

          // Preparar datos para enviar
          var payload = {
            values: oData,
          };

          // console.log("Data:", JSON.stringify(oData));

          fetch("http://localhost:4004/api/sec/labelCRUD?procedure=post", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })
            .then((response) => {
              if (!response.ok) {
                return response.text().then((text) => {
                  throw new Error(text);
                });
              }
              return response.json();
            })
            .then((response) => {
              MessageToast.show("Catálogo agregado correctamente");
              this._oAddDialog.close();

              // Agregar el nuevo registro
              aData.push(oData);
              // Actualizar el modelo
              oTableModel.setProperty("/value", aData);
            })
            .catch((error) => {
              MessageToast.show("Error al guardar: " + error.message);
            });
        },

        onCancelAddCatalog: function () {
          if (this._oAddDialog) {
            this._oAddDialog.close();
          }
        },

        // ---------------------------------------------------- FIN PARA AGREGAR UN NUEVO LABEL

        // ---------------------------------------------------- PARA EDITAR UN LABEL

        onEditPressed: function () {
          if (!this._oSelectedItem) return;

          var oContext = this._oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          // Crear modelo para edición
          var oEditModel = new JSONModel($.extend(true, {}, oData));
          this.getView().setModel(oEditModel, "editModel");

          // Cargar diálogo de edición
          if (!this._oEditDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: "com.invertions.sapfiorimodinv.view.catalogs.fragments.EditCatalogDialog",
              controller: this,
            }).then(
              function (oDialog) {
                this._oEditDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
              }.bind(this)
            );
          } else {
            this._oEditDialog.open();
          }
        },

        onSaveEdit: function () {
          var oEditModel = this.getView().getModel("editModel");
          var oEditedData = oEditModel.getData();

          // Obtener el modelo de la tabla
          var oTableModel = this.getView().getModel();
          var aData = oTableModel.getProperty("/value") || [];

          // Llamada a la API para actualizar
          fetch("http://localhost:4004/api/sec/labelCRUD?procedure=patch", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              values: oEditedData,
            }),
          })
            .then((response) => {
              if (!response.ok) {
                return response.text().then((text) => {
                  throw new Error(text);
                });
              }
              return response.json();
            })
            .then((response) => {
              MessageToast.show("Registro actualizado correctamente");
              this._oEditDialog.close();

              const updatedIndex = aData.findIndex(
                (item) => item._id === oEditedData._id
              );

              if (updatedIndex !== -1) {
                aData[updatedIndex] = {
                  ...aData[updatedIndex],
                  LABELID: oEditedData.LABELID,
                  VALUEPAID: oEditedData.VALUEPAID,
                  LABEL: oEditedData.LABEL,
                  INDEX: oEditedData.INDEX,
                  COLLECTION: oEditedData.COLLECTION,
                  SECTION: oEditedData.SECTION,
                  SEQUENCE: oEditedData.SEQUENCE,
                  IMAGE: oEditedData.IMAGE,
                  DESCRIPTION: oEditedData.DESCRIPTION,
                };
                oTableModel.setProperty("/values", aData);
              }
            })
            .catch((error) => {
              MessageToast.show("Error al actualizar: " + error.message);
            });
        },

        onCancelEdit: function () {
          if (this._oEditDialog) {
            this._oEditDialog.close();
          }
        },

        // ---------------------------------------------------- FIN PARA EDITAR UN LABEL

        // ---------------------------------------------------- PARA ELIMINAR UN LABEL

        onDeletePressed: function () {
          if (!this._oSelectedItem) return;

          var oContext = this._oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          MessageBox.confirm("¿Está seguro de eliminar este registro?", {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.YES) {
                fetch(
                  "http://localhost:4004/api/sec/labelCRUD?procedure=delete&&type=hard",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ _id: oData._id }),
                  }
                )
                  .then((response) => {
                    if (!response.ok) {
                      return response.text().then((text) => {
                        throw new Error(text);
                      });
                    }
                    return response.json();
                  })
                  .then(() => {
                    MessageToast.show("Registro eliminado");

                    // Actualización local del modelo
                    const oTableModel = this.getView().getModel();
                    const aData = oTableModel.getProperty("/value") || [];

                    const index = aData.findIndex(
                      (item) => item._id === oData._id
                    );
                    if (index !== -1) {
                      aData.splice(index, 1);
                      oTableModel.setProperty("/value", aData);
                    }
                  })
                  .catch((error) => {
                    MessageToast.show("Error al eliminar: " + error.message);
                  });
              }
            }.bind(this),
          });
        },

        // ---------------------------------------------------- FIN PARA ELIMINAR UN LABEL

        // ---------------------------------------------------- ELIMINADO/ACTIVADO LOGICO

        onActivatePressed: function () {
          this._changeStatus(true);
        },

        onDeactivatePressed: function () {
          this._changeStatus(false);
        },

        _changeStatus: function (bActivate) {
          console.log("Activar/Desactivar");

          if (!this._oSelectedItem) {
            console.log("No hay ítem seleccionado");
            return;
          }

          var oContext = this._oSelectedItem.getBindingContext();
          var oData = oContext.getObject();
          var sAction = bActivate ? "activate" : "delete";
          var sStatusMessage = bActivate ? "activado" : "desactivado";

          // Obtener el modelo y los datos actuales
          var oTableModel = this.getView().getModel();
          var aData = oTableModel.getProperty("/value") || [];

          fetch(
            "http://localhost:4004/api/sec/labelCRUD?procedure=delete&&type=logic&&status=" +
              sAction +
              "&&labelID=" +
              oData.LABELID,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
            .then((response) => {
              if (!response.ok) {
                return response.text().then((text) => {
                  throw new Error(text);
                });
              }
              return response.json();
            })
            .then(() => {
              // Actualizar el estado localmente
              const index = aData.findIndex(
                (item) => item.LABELID === oData.LABELID
              );
              if (index !== -1) {
                aData[index].DETAIL_ROW.ACTIVED = bActivate;
                oTableModel.setProperty("/value", aData);
              }

              // Actualizar visibilidad de botones según estado
              this.byId("activateButton").setVisible(!bActivate);
              this.byId("activateButton").setEnabled(!bActivate);
              this.byId("deactivateButton").setVisible(bActivate);
              this.byId("deactivateButton").setEnabled(bActivate);

              MessageToast.show(
                "Registro " + oData.LABELID + ": " + sStatusMessage
              );
            })
            .catch((error) => {
              MessageToast.show("Error: " + error.message);
            });
        },

        // ---------------------------------------------------- FIN ELIMINADO/ACTIVADO LOGICO

        // ---------------------------------------------------- PARA CARGAR VALORES EN EL PANEL DERECHO

        onItemPress: function (oEvent) {
          var oItem = oEvent.getParameter("listItem");
          var oContext = oItem.getBindingContext();
          var oSelectedData = oContext.getObject(); // Obtiene los datos del ítem seleccionado

          var sLabelID = oSelectedData.LABELID;
          var sUrl =
            "http://localhost:4004/api/sec/valuesCRUD?procedure=get&labelID=" +
            encodeURIComponent(sLabelID);
          var that = this;

          fetch(sUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error("Error al obtener datos");
              }
              return response.json();
            })
            .then((response) => {
              const oValuesView = that.byId("XMLViewValues");
              if (oValuesView) {
                oValuesView.loaded().then(() => {
                  const oController = oValuesView.getController();
                  if (oController && oController.loadValues) {
                    // Pasa los valores y el ítem seleccionado
                    oController.loadValues(response.value || []);

                    // Actualiza el selectedValue en el modelo "values"
                    oValuesView
                      .getModel("values")
                      .setProperty("/selectedValue", oSelectedData);
                  }
                });
              }
            })
            .catch(() => {
              MessageToast.show("Error al cargar valores");
            });

          // Expandir el panel derecho
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("50%"); // O el porcentaje/píxeles que prefieras
          }

          // Opcional: reducir el panel izquierdo
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("50%");
          }
        },

        // ---------------------------------------------------- FIN PARA CARGAR VALORES EN EL PANEL DERECHO

        // ---------------------------------------------------- PARA BOTONES DE ACCIONES LOGICAS

        onSelectionChange: function (oEvent) {
          // Obtener el item seleccionado
          var oTable = this.byId("catalogTable");
          var oSelectedItem = oTable.getSelectedItem();

          if (!oSelectedItem) {
            this._disableAllActions();
            return;
          }

          // Habilitar todos los botones de acción
          this.byId("editButton").setEnabled(true);
          this.byId("deleteButton").setEnabled(true);

          // Determinar estado para activar/desactivar
          var oContext = oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          // Actualizar visibilidad de botones según estado
          this.byId("activateButton").setVisible(!oData.DETAIL_ROW.ACTIVED);
          this.byId("activateButton").setEnabled(!oData.DETAIL_ROW.ACTIVED);
          this.byId("deactivateButton").setVisible(oData.DETAIL_ROW.ACTIVED);
          this.byId("deactivateButton").setEnabled(oData.DETAIL_ROW.ACTIVED);

          // Guardar referencia al item seleccionado
          this._oSelectedItem = oSelectedItem;
        },

        _disableAllActions: function () {
          this.byId("editButton").setEnabled(false);
          this.byId("activateButton").setEnabled(false);
          this.byId("deactivateButton").setEnabled(false);
          this.byId("deleteButton").setEnabled(false);
        },

        // ---------------------------------------------------- FIN PARA BOTONES DE ACCIONES LOGICAS

        // ------------------------------------------------ BOTONES DE ACCIÓN

        onCloseDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("0px");
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("100%");
          }
        },

        onCenterDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("50%");
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("50%");
          }
        },

        onExpandDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("100%");
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("0px");
          }
        },

        // ------------------------------------------------ FIN BOTONES DE ACCIÓN
      }
    );
  }
);
