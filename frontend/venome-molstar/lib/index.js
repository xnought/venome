import { GeometryExport } from "molstar/lib/extensions/geo-export";
import { MAQualityAssessment } from "molstar/lib/extensions/model-archive/quality-assessment/behavior";
import { Mp4Export } from "molstar/lib/extensions/mp4-export";
import { PDBeStructureQualityReport } from "molstar/lib/extensions/pdbe";
import { RCSBAssemblySymmetry, RCSBAssemblySymmetryConfig, } from "molstar/lib/extensions/rcsb/assembly-symmetry/behavior";
import { EmptyLoci, Loci } from "molstar/lib/mol-model/loci";
import { AnimateAssemblyUnwind } from "molstar/lib/mol-plugin-state/animation/built-in/assembly-unwind";
import { AnimateCameraRock } from "molstar/lib/mol-plugin-state/animation/built-in/camera-rock";
import { AnimateCameraSpin } from "molstar/lib/mol-plugin-state/animation/built-in/camera-spin";
import { AnimateModelIndex } from "molstar/lib/mol-plugin-state/animation/built-in/model-index";
import { AnimateStructureSpin } from "molstar/lib/mol-plugin-state/animation/built-in/spin-structure";
import { AnimateStateInterpolation } from "molstar/lib/mol-plugin-state/animation/built-in/state-interpolation";
import { AnimateStateSnapshots } from "molstar/lib/mol-plugin-state/animation/built-in/state-snapshots";
import { clearStructureOverpaint } from "molstar/lib/mol-plugin-state/helpers/structure-overpaint";
import { createStructureRepresentationParams } from "molstar/lib/mol-plugin-state/helpers/structure-representation-params";
import { StructureComponentManager } from "molstar/lib/mol-plugin-state/manager/structure/component";
import { createPluginUI } from "molstar/lib/mol-plugin-ui/react18";
import { FocusLoci } from "molstar/lib/mol-plugin/behavior/dynamic/camera";
import { SelectLoci } from "molstar/lib/mol-plugin/behavior/dynamic/representation";
import { StructureFocusRepresentation } from "molstar/lib/mol-plugin/behavior/dynamic/selection/structure-focus-representation";
import { InitVolumeStreaming } from "molstar/lib/mol-plugin/behavior/dynamic/volume-streaming/transformers";
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { PluginConfig } from "molstar/lib/mol-plugin/config";
import { PluginLayoutStateParams } from "molstar/lib/mol-plugin/layout";
import { PluginSpec } from "molstar/lib/mol-plugin/spec";
import { StateSelection, StateTransform } from "molstar/lib/mol-state";
import { ElementSymbolColorThemeParams } from "molstar/lib/mol-theme/color/element-symbol";
import { Asset } from "molstar/lib/mol-util/assets";
import { Color } from "molstar/lib/mol-util/color/color";
import { ParamDefinition } from "molstar/lib/mol-util/param-definition";
import { RxEventHelper } from "molstar/lib/mol-util/rx-event-helper";
import { CustomEvents } from "./custom-events";
import { PDBeDomainAnnotations } from "./domain-annotations/behavior";
import { AlphafoldView, LigandView, PDBeVolumes, QueryHelper, addDefaults, getStructureUrl, runWithProgressMessage, } from "./helpers";
import { LoadingOverlay } from "./overlay";
import { PluginCustomState } from "./plugin-custom-state";
import { DefaultParams, DefaultPluginUISpec, validateInitParams, } from "./spec";
import { initParamsFromHtmlAttributes } from "./spec-from-html";
import { subscribeToComponentEvents } from "./subscribe-events";
import { initSuperposition } from "./superposition";
import { SuperpositionFocusRepresentation } from "./superposition-focus-representation";
import { LeftPanelControls } from "./ui/pdbe-left-panel";
import { PDBeLigandViewStructureTools, PDBeStructureTools, PDBeSuperpositionStructureTools, } from "./ui/pdbe-structure-controls";
import { PDBeViewportControls } from "./ui/pdbe-viewport-controls";
import { SuperpostionViewport } from "./ui/superposition-viewport";
import "molstar/lib/mol-plugin-ui/skin/dark.scss";
import "./overlay.scss";
export class PDBeMolstarPlugin {
    _ev = RxEventHelper.create();
    events = {
        loadComplete: this._ev(),
    };
    plugin;
    initParams;
    targetElement;
    assemblyRef = "";
    selectedParams;
    defaultRendererProps;
    defaultMarkingProps;
    isHighlightColorUpdated = false;
    isSelectedColorUpdated = false;
    /** Extract InitParams from attributes of an HTML element */
    static initParamsFromHtmlAttributes(element) {
        return initParamsFromHtmlAttributes(element);
    }
    async render(target, options) {
        console.debug("Rendering PDBeMolstarPlugin instance with options:", options);
        // Validate options
        if (!options) {
            console.error("Missing `options` argument to `PDBeMolstarPlugin.render");
            return;
        }
        const validationIssues = validateInitParams(options);
        if (validationIssues) {
            console.error("Invalid PDBeMolstarPlugin options:", options);
            return;
        }
        this.initParams = addDefaults(options, DefaultParams);
        // Set PDBe Plugin Spec
        const pdbePluginSpec = DefaultPluginUISpec();
        pdbePluginSpec.config ??= [];
        if (!this.initParams.ligandView &&
            !this.initParams.superposition &&
            this.initParams.selectInteraction) {
            pdbePluginSpec.behaviors.push(PluginSpec.Behavior(StructureFocusRepresentation));
        }
        if (this.initParams.superposition) {
            pdbePluginSpec.behaviors.push(PluginSpec.Behavior(SuperpositionFocusRepresentation), PluginSpec.Behavior(MAQualityAssessment, {
                autoAttach: true,
                showTooltip: true,
            }));
        }
        // Add custom properties
        if (this.initParams.domainAnnotation) {
            pdbePluginSpec.behaviors.push(PluginSpec.Behavior(PDBeDomainAnnotations, {
                autoAttach: true,
                showTooltip: false,
            }));
        }
        if (this.initParams.validationAnnotation) {
            pdbePluginSpec.behaviors.push(PluginSpec.Behavior(PDBeStructureQualityReport, {
                autoAttach: true,
                showTooltip: false,
            }));
        }
        if (this.initParams.symmetryAnnotation) {
            pdbePluginSpec.behaviors.push(PluginSpec.Behavior(RCSBAssemblySymmetry));
            pdbePluginSpec.config.push([RCSBAssemblySymmetryConfig.DefaultServerType, "pdbe"], [
                RCSBAssemblySymmetryConfig.DefaultServerUrl,
                "https://www.ebi.ac.uk/pdbe/aggregated-api/pdb/symmetry",
            ], [RCSBAssemblySymmetryConfig.ApplyColors, false]);
        }
        pdbePluginSpec.layout = {
            initial: {
                isExpanded: this.initParams.expanded,
                showControls: !this.initParams.hideControls,
                regionState: {
                    left: "full",
                    right: "full",
                    top: this.initParams.sequencePanel ? "full" : "hidden",
                    bottom: "full",
                },
                controlsDisplay: this.initParams.reactive
                    ? "reactive"
                    : this.initParams.landscape
                        ? "landscape"
                        : PluginLayoutStateParams.controlsDisplay.defaultValue,
            },
        };
        pdbePluginSpec.components = {
            controls: {
                left: LeftPanelControls,
                // right: DefaultStructureTools,
                // top: 'none',
                bottom: "none",
            },
            viewport: {
                controls: PDBeViewportControls,
                view: this.initParams.superposition
                    ? SuperpostionViewport
                    : void 0,
            },
            remoteState: "none",
            structureTools: this.initParams.superposition
                ? PDBeSuperpositionStructureTools
                : this.initParams.ligandView
                    ? PDBeLigandViewStructureTools
                    : PDBeStructureTools,
        };
        if (this.initParams.alphafoldView) {
            pdbePluginSpec.behaviors.push(PluginSpec.Behavior(MAQualityAssessment, {
                autoAttach: true,
                showTooltip: true,
            }));
        }
        pdbePluginSpec.config.push([
            PluginConfig.Structure.DefaultRepresentationPresetParams,
            {
                theme: {
                    globalName: this.initParams.alphafoldView
                        ? "plddt-confidence"
                        : undefined,
                    carbonColor: { name: "element-symbol", params: {} },
                    focus: {
                        name: "element-symbol",
                        params: {
                            carbonColor: { name: "element-symbol", params: {} },
                        },
                    },
                },
            },
        ]);
        ElementSymbolColorThemeParams.carbonColor.defaultValue = {
            name: "element-symbol",
            params: {},
        };
        // Add animation props
        if (!this.initParams.ligandView && !this.initParams.superposition) {
            pdbePluginSpec.animations = [
                AnimateModelIndex,
                AnimateCameraSpin,
                AnimateCameraRock,
                AnimateStateSnapshots,
                AnimateAssemblyUnwind,
                AnimateStructureSpin,
                AnimateStateInterpolation,
            ];
            pdbePluginSpec.behaviors.push(PluginSpec.Behavior(Mp4Export));
            pdbePluginSpec.behaviors.push(PluginSpec.Behavior(GeometryExport));
        }
        if (this.initParams.hideCanvasControls.includes("expand"))
            pdbePluginSpec.config.push([
                PluginConfig.Viewport.ShowExpand,
                false,
            ]);
        if (this.initParams.hideCanvasControls.includes("selection"))
            pdbePluginSpec.config.push([
                PluginConfig.Viewport.ShowSelectionMode,
                false,
            ]);
        if (this.initParams.hideCanvasControls.includes("animation"))
            pdbePluginSpec.config.push([
                PluginConfig.Viewport.ShowAnimation,
                false,
            ]);
        if (this.initParams.hideCanvasControls.includes("controlToggle"))
            pdbePluginSpec.config.push([
                PluginConfig.Viewport.ShowControls,
                false,
            ]);
        if (this.initParams.hideCanvasControls.includes("controlInfo"))
            pdbePluginSpec.config.push([
                PluginConfig.Viewport.ShowSettings,
                false,
            ]);
        // override default event bindings
        if (this.initParams.selectBindings) {
            pdbePluginSpec.behaviors.push(PluginSpec.Behavior(SelectLoci, {
                bindings: this.initParams.selectBindings,
            }));
        }
        if (this.initParams.focusBindings) {
            pdbePluginSpec.behaviors.push(PluginSpec.Behavior(FocusLoci, {
                bindings: this.initParams.focusBindings,
            }));
        }
        this.targetElement =
            typeof target === "string"
                ? document.getElementById(target)
                : target;
        this.targetElement.viewerInstance = this;
        // Create/ Initialise Plugin
        this.plugin = await createPluginUI(this.targetElement, pdbePluginSpec);
        PluginCustomState(this.plugin).initParams = { ...this.initParams };
        PluginCustomState(this.plugin).events = {
            segmentUpdate: this._ev(),
            superpositionInit: this._ev(),
            isBusy: this._ev(),
        };
        // Set background colour
        if (this.initParams.bgColor || this.initParams.lighting) {
            this.canvas.applySettings({
                color: this.initParams.bgColor,
                lighting: this.initParams.lighting,
            });
        }
        // Set selection granularity
        if (this.initParams.granularity) {
            this.plugin.managers.interactivity.setProps({
                granularity: this.initParams.granularity,
            });
        }
        // Set default highlight and selection colors
        if (this.initParams.highlightColor || this.initParams.selectColor) {
            this.visual.setColor({
                highlight: this.initParams.highlightColor,
                select: this.initParams.selectColor,
            });
        }
        // Save renderer defaults
        this.defaultRendererProps = { ...this.plugin.canvas3d.props.renderer };
        this.defaultMarkingProps = { ...this.plugin.canvas3d.props.marking };
        if (this.initParams.superposition) {
            // Set left panel tab
            this.plugin.behaviors.layout.leftPanelTabName.next("segments");
            // Initialise superposition
            if (this.initParams.loadingOverlay) {
                new LoadingOverlay(this.targetElement, {
                    resize: this.plugin?.canvas3d?.resized,
                    hide: this.events.loadComplete,
                }).show();
            }
            initSuperposition(this.plugin, this.events.loadComplete);
        }
        else {
            // Collapse left panel and set left panel tab to none
            PluginCommands.Layout.Update(this.plugin, {
                state: {
                    regionState: {
                        ...this.plugin.layout.state.regionState,
                        left: "collapsed",
                    },
                },
            });
            this.plugin.behaviors.layout.leftPanelTabName.next("none");
            // Load Molecule CIF or coordQuery and Parse
            const dataSource = this.getMoleculeSrcUrl();
            if (dataSource) {
                if (this.initParams.loadingOverlay) {
                    new LoadingOverlay(this.targetElement, {
                        resize: this.plugin?.canvas3d?.resized,
                        hide: this.events.loadComplete,
                    }).show();
                }
                this.load({
                    url: dataSource.url,
                    format: dataSource.format,
                    assemblyId: this.initParams.assemblyId,
                    isBinary: dataSource.isBinary,
                    progressMessage: `Loading ${this.initParams.moleculeId ?? ""} ...`,
                });
            }
            // Binding to other PDB Component events
            if (this.initParams.subscribeEvents) {
                subscribeToComponentEvents(this);
            }
            // Event handling
            CustomEvents.add(this.plugin, this.targetElement);
        }
    }
    getMoleculeSrcUrl() {
        if (this.initParams.customData) {
            let { url, format, binary } = this.initParams.customData;
            if (!url || !format) {
                throw new Error(`Provide all custom data parameters`);
            }
            if (format === "cif" || format === "bcif")
                format = "mmcif";
            // Validate supported format
            const supportedFormats = ["mmcif", "pdb", "sdf"];
            if (!supportedFormats.includes(format)) {
                throw new Error(`${format} not supported.`);
            }
            return {
                url: url,
                format: format,
                isBinary: binary,
            };
        }
        if (this.initParams.moleculeId) {
            const request = {
                pdbId: this.initParams.moleculeId,
                queryType: "full",
                queryParams: {},
            };
            if (this.initParams.ligandView) {
                request.queryType = "residueSurroundings";
                request.queryParams["data_source"] = "pdb-h";
                if (!this.initParams.ligandView.label_comp_id_list) {
                    request.queryParams["label_comp_id"] =
                        this.initParams.ligandView.label_comp_id;
                    request.queryParams["auth_seq_id"] =
                        this.initParams.ligandView.auth_seq_id;
                    request.queryParams["auth_asym_id"] =
                        this.initParams.ligandView.auth_asym_id;
                }
            }
            return {
                url: getStructureUrl(this.initParams, request),
                format: "mmcif",
                isBinary: this.initParams.encoding === "bcif",
            };
        }
        throw new Error(`Mandatory parameters missing! (customData or moleculeId must be defined)`);
    }
    screenshotData() {
        return this.plugin.helpers.viewportScreenshot?.getImageDataUri();
    }
    get state() {
        return this.plugin.state.data;
    }
    async createLigandStructure(isBranched) {
        if (this.assemblyRef === "")
            return;
        for await (const comp of this.plugin.managers.structure.hierarchy
            .currentComponentGroups) {
            await PluginCommands.State.RemoveObject(this.plugin, {
                state: comp[0].cell.parent,
                ref: comp[0].cell.transform.ref,
                removeParentGhosts: true,
            });
        }
        const structure = this.state.select(this.assemblyRef)[0];
        let ligandQuery;
        if (isBranched) {
            ligandQuery = LigandView.branchedQuery(this.initParams.ligandView?.label_comp_id_list);
        }
        else {
            ligandQuery = LigandView.query(this.initParams.ligandView);
        }
        const ligandVis = await this.plugin.builders.structure.tryCreateComponentFromExpression(structure, ligandQuery.core, "pivot", { label: "Ligand" });
        if (ligandVis)
            await this.plugin.builders.structure.representation.addRepresentation(ligandVis, {
                type: "ball-and-stick",
                color: "element-symbol",
                colorParams: {
                    carbonColor: { name: "element-symbol", params: {} },
                },
                size: "uniform",
                sizeParams: { value: 2.5 },
            }, { tag: "ligand-vis" });
        const ligandSurr = await this.plugin.builders.structure.tryCreateComponentFromExpression(structure, ligandQuery.surroundings, "rest", { label: "Surroundings" });
        if (ligandSurr)
            await this.plugin.builders.structure.representation.addRepresentation(ligandSurr, {
                type: "ball-and-stick",
                color: "element-symbol",
                colorParams: {
                    carbonColor: { name: "element-symbol", params: {} },
                },
                size: "uniform",
                sizeParams: { value: 0.8 },
            });
        // Focus ligand
        const ligRef = StateSelection.findTagInSubtree(this.plugin.state.data.tree, StateTransform.RootRef, "ligand-vis");
        if (!ligRef)
            return;
        const cell = this.plugin.state.data.cells.get(ligRef);
        if (cell?.obj) {
            const repr = cell.obj.data.repr;
            const ligLoci = repr.getAllLoci()[0]; // getAllLoci returns multiple copies of the same loci (one per representation visual)
            this.plugin.managers.structure.focus.setFromLoci(ligLoci);
            // focus-add is not handled in camera behavior, doing it here
            const current = this.plugin.managers.structure.focus.current?.loci;
            if (current)
                this.plugin.managers.camera.focusLoci(current);
        }
    }
    async load({ url, format = "mmcif", isBinary = false, assemblyId = "", progressMessage, }, fullLoad = true) {
        await runWithProgressMessage(this.plugin, progressMessage, async () => {
            let success = false;
            try {
                if (fullLoad)
                    await this.clear();
                const isHetView = this.initParams.ligandView ? true : false;
                let downloadOptions = void 0;
                let isBranchedView = false;
                if (this.initParams.ligandView &&
                    this.initParams.ligandView.label_comp_id_list) {
                    isBranchedView = true;
                    downloadOptions = {
                        body: JSON.stringify(this.initParams.ligandView.label_comp_id_list),
                        headers: [["Content-type", "application/json"]],
                    };
                }
                const data = await this.plugin.builders.data.download({ url: Asset.Url(url, downloadOptions), isBinary }, { state: { isGhost: true } });
                const trajectory = await this.plugin.builders.structure.parseTrajectory(data, format);
                if (!isHetView) {
                    await this.plugin.builders.structure.hierarchy.applyPreset(trajectory, this.initParams.defaultPreset, {
                        structure: assemblyId
                            ? assemblyId === "preferred"
                                ? void 0
                                : {
                                    name: "assembly",
                                    params: { id: assemblyId },
                                }
                            : { name: "model", params: {} },
                        showUnitcell: false,
                        representationPreset: "auto",
                    });
                    if (this.initParams.hideStructure.length > 0 ||
                        this.initParams.visualStyle) {
                        this.applyVisualParams();
                    }
                }
                else {
                    const model = await this.plugin.builders.structure.createModel(trajectory);
                    await this.plugin.builders.structure.createStructure(model, { name: "model", params: {} });
                }
                // show selection if param is set
                if (this.initParams.selection) {
                    this.visual.select(this.initParams.selection);
                }
                // Store assembly ref
                const pivotIndex = this.plugin.managers.structure.hierarchy.selection
                    .structures.length - 1;
                const pivot = this.plugin.managers.structure.hierarchy.selection
                    .structures[pivotIndex];
                if (pivot && pivot.cell.parent)
                    this.assemblyRef = pivot.cell.transform.ref;
                // Load Volume
                if (this.initParams.loadMaps) {
                    if (this.assemblyRef === "")
                        return;
                    const asm = this.state.select(this.assemblyRef)[0].obj;
                    const defaultMapParams = InitVolumeStreaming.createDefaultParams(asm, this.plugin);
                    const pdbeMapParams = PDBeVolumes.mapParams(defaultMapParams, this.initParams.mapSettings, "");
                    if (pdbeMapParams) {
                        await this.plugin.runTask(this.state.applyAction(InitVolumeStreaming, pdbeMapParams, this.assemblyRef));
                        if (pdbeMapParams.method !== "em" &&
                            !this.initParams.ligandView)
                            PDBeVolumes.displayUsibilityMessage(this.plugin);
                    }
                }
                // Create Ligand Representation
                if (isHetView) {
                    await this.createLigandStructure(isBranchedView);
                }
                success = true;
            }
            finally {
                this.events.loadComplete.next(success);
            }
        });
    }
    applyVisualParams = () => {
        const componentGroups = this.plugin.managers.structure.hierarchy.currentComponentGroups;
        for (const compGroup of componentGroups) {
            const compRef = compGroup[compGroup.length - 1];
            const tag = compRef.key ?? "";
            const remove = this.initParams.hideStructure.some((type) => StructureComponentTags[type]?.includes(tag));
            if (remove) {
                this.plugin.managers.structure.hierarchy.remove([compRef]);
            }
            if (!remove && this.initParams.visualStyle) {
                if (compRef && compRef.representations) {
                    compRef.representations.forEach((rep) => {
                        const currentParams = createStructureRepresentationParams(this.plugin, void 0, { type: this.initParams.visualStyle });
                        this.plugin.managers.structure.component.updateRepresentations([compRef], rep, currentParams);
                    });
                }
            }
        }
    };
    canvas = {
        toggleControls: (isVisible) => {
            if (typeof isVisible === "undefined")
                isVisible = !this.plugin.layout.state.showControls;
            PluginCommands.Layout.Update(this.plugin, {
                state: { showControls: isVisible },
            });
        },
        toggleExpanded: (isExpanded) => {
            if (typeof isExpanded === "undefined")
                isExpanded = !this.plugin.layout.state.isExpanded;
            PluginCommands.Layout.Update(this.plugin, {
                state: { isExpanded: isExpanded },
            });
        },
        setBgColor: async (color) => {
            if (!color)
                return;
            await this.canvas.applySettings({ color });
        },
        applySettings: async (settings) => {
            if (!settings)
                return;
            if (!this.plugin.canvas3d)
                return;
            const renderer = { ...this.plugin.canvas3d.props.renderer };
            if (settings.color) {
                renderer.backgroundColor = Color.fromRgb(settings.color.r, settings.color.g, settings.color.b);
            }
            if (settings.lighting) {
                renderer.style = { name: settings.lighting }; // I don't think this does anything and I don't see how it could ever have worked
            }
            await PluginCommands.Canvas3D.SetSettings(this.plugin, {
                settings: { renderer },
            });
        },
    };
    getLociForParams(params, structureNumber) {
        let assemblyRef = this.assemblyRef;
        if (structureNumber) {
            assemblyRef =
                this.plugin.managers.structure.hierarchy.current.structures[structureNumber - 1].cell.transform.ref;
        }
        if (assemblyRef === "")
            return EmptyLoci;
        const data = this.plugin.state.data.select(assemblyRef)[0]
            .obj.data;
        if (!data)
            return EmptyLoci;
        return QueryHelper.getInteractivityLoci(params, data);
    }
    getLociByPLDDT(score, structureNumber) {
        let assemblyRef = this.assemblyRef;
        if (structureNumber) {
            assemblyRef =
                this.plugin.managers.structure.hierarchy.current.structures[structureNumber - 1].cell.transform.ref;
        }
        if (assemblyRef === "")
            return EmptyLoci;
        const data = this.plugin.state.data.select(assemblyRef)[0]
            .obj.data;
        if (!data)
            return EmptyLoci;
        return AlphafoldView.getLociByPLDDT(score, data);
    }
    normalizeColor(colorVal, defaultColor) {
        let color = Color.fromRgb(170, 170, 170);
        try {
            if (typeof colorVal.r !== "undefined") {
                color = Color.fromRgb(colorVal.r, colorVal.g, colorVal.b);
            }
            else if (colorVal[0] === "#") {
                color = Color(Number(`0x${colorVal.substr(1)}`));
            }
            else {
                color = Color(colorVal);
            }
        }
        catch (e) {
            if (defaultColor)
                color = defaultColor;
        }
        return color;
    }
    visual = {
        highlight: (params) => {
            const loci = this.getLociForParams(params.data, params.structureNumber);
            if (Loci.isEmpty(loci))
                return;
            if (params.color) {
                this.visual.setColor({ highlight: params.color });
            }
            this.plugin.managers.interactivity.lociHighlights.highlightOnly({
                loci,
            });
            if (params.focus)
                this.plugin.managers.camera.focusLoci(loci);
        },
        clearHighlight: async () => {
            this.plugin.managers.interactivity.lociHighlights.highlightOnly({
                loci: EmptyLoci,
            });
            if (this.isHighlightColorUpdated)
                this.visual.reset({ highlightColor: true });
        },
        select: async (params) => {
            // clear prvious selection
            if (this.selectedParams) {
                await this.visual.clearSelection(params.structureNumber);
            }
            // Structure list to apply selection
            let structureData = this.plugin.managers.structure.hierarchy.current.structures;
            if (params.structureNumber) {
                structureData = [
                    this.plugin.managers.structure.hierarchy.current.structures[params.structureNumber - 1],
                ];
            }
            // set non selected theme color
            if (params.nonSelectedColor) {
                for await (const s of structureData) {
                    await this.plugin.managers.structure.component.updateRepresentationsTheme(s.components, {
                        color: "uniform",
                        colorParams: {
                            value: this.normalizeColor(params.nonSelectedColor),
                        },
                    });
                }
            }
            // apply individual selections
            for await (const param of params.data) {
                // get loci from param
                const loci = this.getLociForParams([param], params.structureNumber);
                if (Loci.isEmpty(loci))
                    return;
                // set default selection color to minimise change display
                this.visual.setColor({
                    select: param.color
                        ? param.color
                        : { r: 255, g: 112, b: 3 },
                });
                // apply selection
                this.plugin.managers.interactivity.lociSelects.selectOnly({
                    loci,
                });
                // create theme param values and apply them to create overpaint
                const themeParams = StructureComponentManager.getThemeParams(this.plugin, this.plugin.managers.structure.component.pivotStructure);
                const colorValue = ParamDefinition.getDefaultValues(themeParams);
                colorValue.action.params = {
                    color: param.color
                        ? this.normalizeColor(param.color)
                        : Color.fromRgb(255, 112, 3),
                    opacity: 1,
                };
                await this.plugin.managers.structure.component.applyTheme(colorValue, structureData);
                // add new representations
                if (param.sideChain || param.representation) {
                    let repr = "ball-and-stick";
                    if (param.representation)
                        repr = param.representation;
                    const defaultParams = StructureComponentManager.getAddParams(this.plugin, {
                        allowNone: false,
                        hideSelection: true,
                        checkExisting: true,
                    });
                    const defaultValues = ParamDefinition.getDefaultValues(defaultParams);
                    defaultValues.options = {
                        label: "selection-by-script",
                        checkExisting: params.structureNumber ? false : true,
                    };
                    const values = {
                        ...defaultValues,
                        ...{ representation: repr },
                    };
                    const structures = this.plugin.managers.structure.hierarchy.getStructuresWithSelection();
                    await this.plugin.managers.structure.component.add(values, structures);
                    // Apply uniform theme
                    if (param.representationColor) {
                        let updatedStructureData = this.plugin.managers.structure.hierarchy.current
                            .structures;
                        if (params.structureNumber) {
                            updatedStructureData = [
                                this.plugin.managers.structure.hierarchy.current
                                    .structures[params.structureNumber - 1],
                            ];
                        }
                        const comps = updatedStructureData[0].components;
                        const lastCompsIndex = comps.length - 1;
                        const recentRepComp = [comps[lastCompsIndex]];
                        const uniformColor = param.representationColor
                            ? this.normalizeColor(param.representationColor)
                            : Color.fromRgb(255, 112, 3);
                        this.plugin.managers.structure.component.updateRepresentationsTheme(recentRepComp, {
                            color: "uniform",
                            colorParams: { value: uniformColor },
                        });
                    }
                    params.addedRepr = true;
                }
                // focus loci
                if (param.focus)
                    this.plugin.managers.camera.focusLoci(loci);
                // remove selection
                this.plugin.managers.interactivity.lociSelects.deselect({
                    loci,
                });
            }
            // reset selection color
            this.visual.reset({ selectColor: true });
            // save selection params to optimise clear
            this.selectedParams = params;
        },
        clearSelection: async (structureNumber) => {
            const structIndex = structureNumber ? structureNumber - 1 : 0;
            this.plugin.managers.interactivity.lociSelects.deselectAll();
            // reset theme to default
            if (this.selectedParams && this.selectedParams.nonSelectedColor) {
                this.visual.reset({ theme: true });
            }
            // remove overpaints
            await clearStructureOverpaint(this.plugin, this.plugin.managers.structure.hierarchy.current.structures[structIndex].components);
            // remove selection representations
            if (this.selectedParams && this.selectedParams.addedRepr) {
                const selReprCells = [];
                for (const c of this.plugin.managers.structure.hierarchy.current
                    .structures[structIndex].components) {
                    if (c.cell &&
                        c.cell.params &&
                        c.cell.params.values &&
                        c.cell.params.values.label === "selection-by-script")
                        selReprCells.push(c.cell);
                }
                if (selReprCells.length > 0) {
                    for await (const selReprCell of selReprCells) {
                        await PluginCommands.State.RemoveObject(this.plugin, {
                            state: selReprCell.parent,
                            ref: selReprCell.transform.ref,
                        });
                    }
                }
            }
            this.selectedParams = undefined;
        },
        update: async (options, fullLoad) => {
            console.debug("Updating PDBeMolstarPlugin instance with options:", options);
            // Validate options
            if (!options) {
                console.error("Missing `options` argument to `PDBeMolstarPlugin.visual.update");
                return;
            }
            const validationIssues = validateInitParams(options);
            if (validationIssues) {
                console.error("Invalid PDBeMolstarPlugin options:", options);
                return;
            }
            this.initParams = addDefaults(options, DefaultParams);
            if (!this.initParams.moleculeId && !this.initParams.customData)
                return false;
            if (this.initParams.customData &&
                this.initParams.customData.url &&
                !this.initParams.customData.format)
                return false;
            PluginCustomState(this.plugin).initParams = this.initParams;
            // Show/hide buttons in the viewport control panel
            this.plugin.config.set(PluginConfig.Viewport.ShowExpand, !this.initParams.hideCanvasControls.includes("expand"));
            this.plugin.config.set(PluginConfig.Viewport.ShowSelectionMode, !this.initParams.hideCanvasControls.includes("selection"));
            this.plugin.config.set(PluginConfig.Viewport.ShowAnimation, !this.initParams.hideCanvasControls.includes("animation"));
            this.plugin.config.set(PluginConfig.Viewport.ShowControls, !this.initParams.hideCanvasControls.includes("controlToggle"));
            this.plugin.config.set(PluginConfig.Viewport.ShowSettings, !this.initParams.hideCanvasControls.includes("controlInfo"));
            // Set background colour
            if (this.initParams.bgColor || this.initParams.lighting) {
                await this.canvas.applySettings({
                    color: this.initParams.bgColor,
                    lighting: this.initParams.lighting,
                });
            }
            // Load Molecule CIF or coordQuery and Parse
            const dataSource = this.getMoleculeSrcUrl();
            if (dataSource) {
                await this.load({
                    url: dataSource.url,
                    format: dataSource.format,
                    assemblyId: this.initParams.assemblyId,
                    isBinary: dataSource.isBinary,
                }, fullLoad);
            }
        },
        visibility: async (data) => {
            if (!data)
                return;
            for (const visual in data) {
                const tags = StructureComponentTags[visual] ?? [];
                for (const tag of tags) {
                    const componentRef = StateSelection.findTagInSubtree(this.plugin.state.data.tree, StateTransform.RootRef, tag);
                    if (componentRef) {
                        const compVisual = this.plugin.state.data.select(componentRef)[0];
                        if (compVisual && compVisual.obj) {
                            const currentlyVisible = compVisual.state && compVisual.state.isHidden
                                ? false
                                : true;
                            if (data[visual] !== currentlyVisible) {
                                await PluginCommands.State.ToggleVisibility(this.plugin, { state: this.state, ref: componentRef });
                            }
                        }
                    }
                }
            }
        },
        toggleSpin: async (isSpinning, resetCamera) => {
            if (!this.plugin.canvas3d)
                return;
            const trackball = this.plugin.canvas3d.props.trackball;
            let toggleSpinParam = trackball.animate.name === "spin"
                ? { name: "off", params: {} }
                : { name: "spin", params: { speed: 1 } };
            if (typeof isSpinning !== "undefined") {
                toggleSpinParam = { name: "off", params: {} };
                if (isSpinning)
                    toggleSpinParam = { name: "spin", params: { speed: 1 } };
            }
            await PluginCommands.Canvas3D.SetSettings(this.plugin, {
                settings: {
                    trackball: { ...trackball, animate: toggleSpinParam },
                },
            });
            if (resetCamera)
                await PluginCommands.Camera.Reset(this.plugin, {});
        },
        focus: async (params, structureNumber) => {
            const loci = this.getLociForParams(params, structureNumber);
            this.plugin.managers.camera.focusLoci(loci);
        },
        setColor: async (param) => {
            if (!this.plugin.canvas3d)
                return;
            if (!param.highlight && !param.select)
                return;
            const renderer = { ...this.plugin.canvas3d.props.renderer };
            const marking = { ...this.plugin.canvas3d.props.marking };
            if (param.highlight) {
                renderer.highlightColor = this.normalizeColor(param.highlight);
                marking.highlightEdgeColor = Color.darken(this.normalizeColor(param.highlight), 1);
                this.isHighlightColorUpdated = true;
            }
            if (param.select) {
                renderer.selectColor = this.normalizeColor(param.select);
                marking.selectEdgeColor = Color.darken(this.normalizeColor(param.select), 1);
                this.isSelectedColorUpdated = true;
            }
            await PluginCommands.Canvas3D.SetSettings(this.plugin, {
                settings: { renderer, marking },
            });
        },
        reset: async (params) => {
            if (params.camera)
                await PluginCommands.Camera.Reset(this.plugin, {
                    durationMs: 250,
                });
            if (params.theme) {
                const defaultTheme = {
                    color: this.initParams.alphafoldView
                        ? "plddt-confidence"
                        : "default",
                };
                const componentGroups = this.plugin.managers.structure.hierarchy
                    .currentComponentGroups;
                for (const compGrp of componentGroups) {
                    await this.plugin.managers.structure.component.updateRepresentationsTheme(compGrp, defaultTheme);
                }
            }
            if (params.highlightColor || params.selectColor) {
                if (!this.plugin.canvas3d)
                    return;
                const renderer = { ...this.plugin.canvas3d.props.renderer };
                const marking = { ...this.plugin.canvas3d.props.marking };
                if (params.highlightColor) {
                    renderer.highlightColor =
                        this.defaultRendererProps.highlightColor;
                    marking.highlightEdgeColor =
                        this.defaultMarkingProps.highlightEdgeColor;
                    this.isHighlightColorUpdated = false;
                }
                if (params.selectColor) {
                    renderer.selectColor =
                        this.defaultRendererProps.selectColor;
                    marking.selectEdgeColor =
                        this.defaultMarkingProps.selectEdgeColor;
                    this.isSelectedColorUpdated = false;
                }
                await PluginCommands.Canvas3D.SetSettings(this.plugin, {
                    settings: { renderer, marking },
                });
            }
        },
    };
    async clear() {
        await this.plugin.clear();
        this.assemblyRef = "";
        this.selectedParams = void 0;
        this.isHighlightColorUpdated = false;
        this.isSelectedColorUpdated = false;
    }
}
const StructureComponentTags = {
    polymer: ["structure-component-static-polymer"],
    het: [
        "structure-component-static-ligand",
        "structure-component-static-ion",
    ],
    water: ["structure-component-static-water"],
    carbs: ["structure-component-static-branched"],
    nonStandard: ["structure-component-static-non-standard"],
    coarse: ["structure-component-static-coarse"],
    maps: ["volume-streaming-info"],
};
window.PDBeMolstarPlugin = PDBeMolstarPlugin;
