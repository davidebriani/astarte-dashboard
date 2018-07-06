module Page.TriggerBuilder exposing (Model, Msg, init, update, view)

import Regex exposing (regex)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (onClick, onInput)
import Navigation


-- Types

import Route
import AstarteApi
import Types.Session exposing (Session)
import Types.ExternalMessage as ExternalMsg exposing (ExternalMsg)
import Types.Interface as Interface exposing (Interface)
import Types.InterfaceMapping as InterfaceMapping exposing (InterfaceMapping, MappingType(..))
import Types.Trigger as Trigger exposing (Trigger)
import Types.DataTrigger as DataTrigger exposing (DataTrigger, DataTriggerEvent)
import Types.DeviceTrigger as DeviceTrigger exposing (DeviceTrigger, DeviceTriggerEvent)
import Types.FlashMessage as FlashMessage exposing (FlashMessage, Severity)
import Utilities


-- bootstrap components

import Bootstrap.Button as Button
import Bootstrap.Form as Form
import Bootstrap.Form.Checkbox as Checkbox
import Bootstrap.Form.Fieldset as Fieldset
import Bootstrap.Form.Input as Input
import Bootstrap.Form.Radio as Radio
import Bootstrap.Form.Select as Select
import Bootstrap.Form.Textarea as Textarea
import Bootstrap.Grid as Grid
import Bootstrap.Grid.Col as Col
import Bootstrap.Grid.Row as Row
import Bootstrap.ListGroup as ListGroup
import Bootstrap.Utilities.Display as Display
import Bootstrap.Utilities.Spacing as Spacing


type alias Model =
    { trigger : Trigger
    , editMode : Bool
    , refInterface : Maybe Interface
    , interfaces : List String
    , majors : List Int
    , mappingType : Maybe InterfaceMapping.MappingType

    -- decoupled types
    , selectedInterfaceName : String
    , selectedInterfaceMajor : Maybe Int
    , selectedOperator : String
    , selectedKnownValue : Maybe String
    }


init : Maybe String -> Session -> ( Model, Cmd Msg )
init maybeTriggerName session =
    ( { trigger = Trigger.empty
      , editMode = False
      , refInterface = Nothing
      , interfaces = []
      , majors = []
      , mappingType = Nothing
      , selectedInterfaceName = ""
      , selectedInterfaceMajor = Nothing
      , selectedOperator = ""
      , selectedKnownValue = Nothing
      }
    , case maybeTriggerName of
        Just name ->
            Cmd.batch
                [ AstarteApi.getTrigger name
                    session
                    GetTriggerDone
                    (ShowError "Cannot retrieve selected trigger.")
                    RedirectToLogin
                , AstarteApi.listInterfaces session
                    GetInterfaceListDone
                    (ShowError "Cannot retrieve interface list.")
                    RedirectToLogin
                ]

        Nothing ->
            AstarteApi.listInterfaces session
                GetInterfaceListDone
                (ShowError "Cannot retrieve interface list.")
                RedirectToLogin
    )


type Msg
    = GetTriggerDone Trigger
    | AddTrigger
    | AddTriggerDone String
    | GetInterfaceListDone (List String)
    | GetInterfaceMajorsDone (List Int)
    | GetInterfaceDone Interface
    | ShowError String String
    | RedirectToLogin
    | Forward ExternalMsg
      -- Trigger messages
    | UpdateTriggerName String
    | UpdateTriggerUrl String
    | UpdateTriggerTemplate String
    | UpdateMustachePayload String
    | UpdateSimpleTriggerType String
      -- Data Trigger
    | UpdateDataTriggerInterfaceName String
    | UpdateDataTriggerInterfaceMajor String
    | UpdateDataTriggerCondition String
    | UpdateDataTriggerPath String
    | UpdateDataTriggerOperator String
    | UpdateDataTriggerKnownValue String
      -- Device Trigger
    | UpdateDeviceTriggerId String
    | UpdateDeviceTriggerCondition String


update : Session -> Msg -> Model -> ( Model, Cmd Msg, ExternalMsg )
update session msg model =
    case msg of
        GetTriggerDone trigger ->
            case trigger.simpleTrigger of
                Trigger.Data dataTrigger ->
                    let
                        ( operatorString, knownValueString ) =
                            decoupleOperator dataTrigger.operator
                    in
                        ( { model
                            | trigger = trigger
                            , editMode = True
                            , selectedInterfaceName = dataTrigger.interfaceName
                            , selectedInterfaceMajor = Just dataTrigger.interfaceMajor
                            , selectedOperator = operatorString
                            , selectedKnownValue = knownValueString
                          }
                        , Cmd.batch
                            [ AstarteApi.getInterface dataTrigger.interfaceName
                                dataTrigger.interfaceMajor
                                session
                                GetInterfaceDone
                                (ShowError "Cannot retrieve interface.")
                                RedirectToLogin
                            , AstarteApi.listInterfaceMajors dataTrigger.interfaceName
                                session
                                GetInterfaceMajorsDone
                                (ShowError "Cannot retrieve interface major versions.")
                                RedirectToLogin
                            ]
                        , ExternalMsg.Noop
                        )

                _ ->
                    ( { model
                        | trigger = trigger
                        , editMode = True
                      }
                    , Cmd.none
                    , ExternalMsg.Noop
                    )

        GetInterfaceListDone interfaces ->
            ( { model | interfaces = interfaces }
            , Cmd.none
            , ExternalMsg.Noop
            )

        GetInterfaceMajorsDone majors ->
            case ( model.refInterface, majors ) of
                ( Nothing, major :: tail ) ->
                    ( { model
                        | majors = majors
                        , selectedInterfaceMajor = Just major
                      }
                    , AstarteApi.getInterface model.selectedInterfaceName
                        major
                        session
                        GetInterfaceDone
                        (ShowError "Cannot retrieve interface.")
                        RedirectToLogin
                    , ExternalMsg.Noop
                    )

                _ ->
                    ( { model | majors = majors }
                    , Cmd.none
                    , ExternalMsg.Noop
                    )

        GetInterfaceDone interface ->
            case model.trigger.simpleTrigger of
                Trigger.Data dataTrigger ->
                    let
                        newSimpleTrigger =
                            dataTrigger
                                |> DataTrigger.setInterfaceName interface.name
                                |> DataTrigger.setInterfaceMajor interface.major
                                |> Trigger.Data
                    in
                        ( { model
                            | trigger = Trigger.setSimpleTrigger newSimpleTrigger model.trigger
                            , refInterface = Just interface
                            , mappingType = matchPath dataTrigger.path <| Interface.mappingsAsList interface
                            , selectedInterfaceName = interface.name
                            , selectedInterfaceMajor = Just interface.major
                          }
                        , Cmd.none
                        , ExternalMsg.Noop
                        )

                Trigger.Device _ ->
                    ( { model | refInterface = Just interface }
                    , Cmd.none
                    , ExternalMsg.Noop
                    )

        ShowError actionError errorMessage ->
            ( model
            , Cmd.none
            , [ actionError, " ", errorMessage ]
                |> String.concat
                |> ExternalMsg.AddFlashMessage FlashMessage.Error
            )

        RedirectToLogin ->
            -- TODO: We should save page context, ask for login and then restore previous context
            ( model
            , Navigation.modifyUrl <| Route.toString (Route.Realm Route.Logout)
            , ExternalMsg.Noop
            )

        Forward msg ->
            ( model
            , Cmd.none
            , msg
            )

        AddTrigger ->
            ( model
            , AstarteApi.addNewTrigger model.trigger
                session
                AddTriggerDone
                (ShowError "Cannot install trigger.")
                RedirectToLogin
            , ExternalMsg.Noop
            )

        AddTriggerDone response ->
            -- redirect to trigger list? or switch to edit mode?
            ( model
            , Cmd.none
            , ExternalMsg.AddFlashMessage FlashMessage.Notice "Trigger succesfully installed."
            )

        UpdateTriggerName newName ->
            ( { model | trigger = Trigger.setName newName model.trigger }
            , Cmd.none
            , ExternalMsg.Noop
            )

        UpdateTriggerUrl newUrl ->
            ( { model | trigger = Trigger.setUrl newUrl model.trigger }
            , Cmd.none
            , ExternalMsg.Noop
            )

        UpdateTriggerTemplate template ->
            let
                t =
                    case template of
                        "mustache" ->
                            Trigger.Mustache ""

                        _ ->
                            Trigger.NoTemplate
            in
                ( { model | trigger = Trigger.setTemplate t model.trigger }
                , Cmd.none
                , ExternalMsg.Noop
                )

        UpdateMustachePayload payload ->
            case model.trigger.template of
                Trigger.Mustache _ ->
                    ( { model | trigger = Trigger.setTemplate (Trigger.Mustache payload) model.trigger }
                    , Cmd.none
                    , ExternalMsg.Noop
                    )

                _ ->
                    ( model
                    , Cmd.none
                    , ExternalMsg.Noop
                    )

        UpdateSimpleTriggerType simpleTriggerType ->
            case simpleTriggerType of
                "data" ->
                    let
                        newSimpleTrigger =
                            Trigger.Data DataTrigger.empty
                    in
                        ( { model
                            | trigger = Trigger.setSimpleTrigger newSimpleTrigger model.trigger
                            , refInterface = Nothing
                          }
                        , Cmd.none
                        , ExternalMsg.Noop
                        )

                "device" ->
                    let
                        newSimpleTrigger =
                            Trigger.Device DeviceTrigger.empty
                    in
                        ( { model | trigger = Trigger.setSimpleTrigger newSimpleTrigger model.trigger }
                        , Cmd.none
                        , ExternalMsg.Noop
                        )

                _ ->
                    ( model
                    , Cmd.none
                    , ExternalMsg.AddFlashMessage FlashMessage.Fatal "Parse error. Unknown simple trigger type"
                    )

        UpdateDataTriggerInterfaceName interfaceName ->
            case model.trigger.simpleTrigger of
                Trigger.Data dataTrigger ->
                    ( { model
                        | majors = []
                        , refInterface = Nothing
                        , selectedInterfaceName = interfaceName
                        , selectedInterfaceMajor = Nothing
                      }
                    , AstarteApi.listInterfaceMajors interfaceName
                        session
                        GetInterfaceMajorsDone
                        (ShowError "Cannot retrieve interface major versions.")
                        RedirectToLogin
                    , ExternalMsg.Noop
                    )

                _ ->
                    ( model
                    , Cmd.none
                    , ExternalMsg.Noop
                    )

        UpdateDataTriggerInterfaceMajor interfaceMajor ->
            case model.trigger.simpleTrigger of
                Trigger.Data dataTrigger ->
                    case (String.toInt interfaceMajor) of
                        Ok newMajor ->
                            ( { model
                                | selectedInterfaceMajor = Just newMajor
                              }
                            , AstarteApi.getInterface model.selectedInterfaceName
                                newMajor
                                session
                                GetInterfaceDone
                                (ShowError "Cannot retrieve interface.")
                                RedirectToLogin
                            , ExternalMsg.Noop
                            )

                        Err _ ->
                            ( model
                            , Cmd.none
                            , ExternalMsg.AddFlashMessage FlashMessage.Fatal "Parse error. interface major is not a number"
                            )

                _ ->
                    ( model
                    , Cmd.none
                    , ExternalMsg.Noop
                    )

        UpdateDataTriggerCondition dataTriggerEvent ->
            case ( model.trigger.simpleTrigger, DataTrigger.stringToDataTriggerEvent dataTriggerEvent ) of
                ( Trigger.Data dataTrigger, Ok newTriggerEvent ) ->
                    let
                        newSimpleTrigger =
                            Trigger.Data { dataTrigger | on = newTriggerEvent }
                    in
                        ( { model | trigger = Trigger.setSimpleTrigger newSimpleTrigger model.trigger }
                        , Cmd.none
                        , ExternalMsg.Noop
                        )

                _ ->
                    ( model
                    , Cmd.none
                    , ExternalMsg.Noop
                    )

        UpdateDataTriggerPath path ->
            case model.trigger.simpleTrigger of
                Trigger.Data dataTrigger ->
                    let
                        newSimpleTrigger =
                            dataTrigger
                                |> DataTrigger.setPath path
                                |> Trigger.Data

                        mapping =
                            case model.refInterface of
                                Just interface ->
                                    Interface.mappingsAsList interface
                                        |> matchPath path

                                Nothing ->
                                    Nothing
                    in
                        ( { model
                            | trigger = Trigger.setSimpleTrigger newSimpleTrigger model.trigger
                            , mappingType = mapping
                          }
                        , Cmd.none
                        , ExternalMsg.Noop
                        )

                Trigger.Device _ ->
                    ( model
                    , Cmd.none
                    , ExternalMsg.Noop
                    )

        UpdateDataTriggerOperator operator ->
            case model.trigger.simpleTrigger of
                Trigger.Data dataTrigger ->
                    case operator of
                        "any" ->
                            let
                                newSimpleTrigger =
                                    dataTrigger
                                        |> DataTrigger.setOperator DataTrigger.Any
                                        |> Trigger.Data
                            in
                                ( { model
                                    | trigger = Trigger.setSimpleTrigger newSimpleTrigger model.trigger
                                    , selectedOperator = operator
                                    , selectedKnownValue = Nothing
                                  }
                                , Cmd.none
                                , ExternalMsg.Noop
                                )

                        _ ->
                            ( { model
                                | selectedOperator = operator
                                , selectedKnownValue = Nothing
                              }
                            , Cmd.none
                            , ExternalMsg.Noop
                            )

                Trigger.Device _ ->
                    ( model
                    , Cmd.none
                    , ExternalMsg.Noop
                    )

        UpdateDataTriggerKnownValue value ->
            case model.trigger.simpleTrigger of
                Trigger.Data dataTrigger ->
                    ( { model | selectedKnownValue = Just value }
                    , Cmd.none
                    , ExternalMsg.Noop
                    )

                Trigger.Device _ ->
                    ( model
                    , Cmd.none
                    , ExternalMsg.Noop
                    )

        UpdateDeviceTriggerId deviceId ->
            case model.trigger.simpleTrigger of
                Trigger.Device deviceTrigger ->
                    let
                        newSimpleTrigger =
                            deviceTrigger
                                |> DeviceTrigger.setDeviceId deviceId
                                |> Trigger.Device
                    in
                        ( { model | trigger = Trigger.setSimpleTrigger newSimpleTrigger model.trigger }
                        , Cmd.none
                        , ExternalMsg.Noop
                        )

                Trigger.Data _ ->
                    ( model
                    , Cmd.none
                    , ExternalMsg.Noop
                    )

        UpdateDeviceTriggerCondition condition ->
            case model.trigger.simpleTrigger of
                Trigger.Device deviceTrigger ->
                    case DeviceTrigger.stringToDeviceTriggerEvent condition of
                        Ok triggerEvent ->
                            let
                                newSimpleTrigger =
                                    deviceTrigger
                                        |> DeviceTrigger.setOn triggerEvent
                                        |> Trigger.Device
                            in
                                ( { model | trigger = Trigger.setSimpleTrigger newSimpleTrigger model.trigger }
                                , Cmd.none
                                , ExternalMsg.Noop
                                )

                        Err err ->
                            ( model
                            , Cmd.none
                            , ExternalMsg.AddFlashMessage FlashMessage.Fatal <| "Parse error. " ++ err
                            )

                Trigger.Data _ ->
                    ( model
                    , Cmd.none
                    , ExternalMsg.Noop
                    )


matchPath : String -> List InterfaceMapping -> Maybe InterfaceMapping.MappingType
matchPath path mappings =
    List.foldr (regMatch path) Nothing mappings


regMatch : String -> InterfaceMapping -> Maybe InterfaceMapping.MappingType -> Maybe InterfaceMapping.MappingType
regMatch path mapping prevValue =
    let
        tokenizedPath =
            String.split "/" path

        tokenizedEndpoint =
            String.split "/" mapping.endpoint
    in
        if (innerMatch tokenizedPath tokenizedEndpoint True) then
            Just mapping.mType
        else
            prevValue


innerMatch : List String -> List String -> Bool -> Bool
innerMatch xa yb prevValue =
    case ( xa, yb, prevValue ) of
        ( [ x ], [ y ], True ) ->
            innerMatchHelp x y

        ( x :: a, y :: b, True ) ->
            innerMatch a b <| innerMatchHelp x y

        ( _, _, _ ) ->
            False


innerMatchHelp : String -> String -> Bool
innerMatchHelp first second =
    (isPlaceholder second) || (first == second)


isPlaceholder : String -> Bool
isPlaceholder token =
    Regex.contains (regex "^%{([a-zA-Z][a-zA-Z0-9]*)}$") token


view : Model -> List FlashMessage -> Html Msg
view model flashMessages =
    Grid.container [ Spacing.mt3Sm ]
        [ Grid.row
            [ Row.middleSm
            , Row.topSm
            ]
            [ Grid.col
                [ Col.sm12 ]
                [ Utilities.renderFlashMessages flashMessages Forward ]
            ]
        , Form.form [ Spacing.mt2Sm ]
            ([ Form.row []
                [ Form.col [ Col.sm12 ]
                    [ h3 []
                        [ text
                            (if model.editMode then
                                model.trigger.name
                             else
                                "Install a new trigger"
                            )
                        ]
                    ]
                ]
             , Form.row []
                [ Form.col [ Col.sm12 ]
                    [ Form.group []
                        [ Form.label [ for "triggerName" ] [ text "Name" ]
                        , Input.text
                            [ Input.id "triggerName"
                            , Input.readonly model.editMode
                            , Input.value model.trigger.name
                            , Input.onInput UpdateTriggerName
                            ]
                        ]
                    ]
                ]
             ]
                ++ renderSimpleTrigger model
                ++ renderTriggerAction model
                ++ [ Form.row [ Row.rightSm ]
                        [ Form.col [ Col.sm4 ]
                            [ Button.button
                                [ Button.primary
                                , Button.disabled model.editMode
                                , Button.attrs [ class "float-right", Spacing.ml2 ]
                                , Button.onClick AddTrigger
                                ]
                                [ text
                                    (if model.editMode then
                                        "Edit Trigger"
                                     else
                                        "Install Trigger"
                                    )
                                ]
                            ]
                        ]
                   ]
            )
        ]


renderTriggerAction : Model -> List (Html Msg)
renderTriggerAction model =
    [ Form.row []
        [ Form.col [ Col.sm12 ]
            [ Form.group []
                [ Form.label [ for "triggerActionType" ] [ text "Action type" ]
                , Select.select
                    [ Select.id "triggerActionType"
                    ]
                    [ Select.item
                        [ value "http" ]
                        [ text "Post a payload using http" ]
                    ]
                ]
            ]
        ]
    , Form.row []
        [ Form.col [ Col.sm12 ]
            [ Form.group []
                [ Form.label [ for "triggerUrl" ] [ text "POST URL" ]
                , Input.text
                    [ Input.id "triggerUrl"
                    , Input.value model.trigger.url
                    , Input.onInput UpdateTriggerUrl
                    ]
                ]
            ]
        ]
    , Form.row []
        (renderTriggerTemplate model.trigger.template)
    ]


renderTriggerTemplate : Trigger.Template -> List (Form.Col Msg)
renderTriggerTemplate template =
    let
        isMustache =
            case template of
                Trigger.NoTemplate ->
                    False

                Trigger.Mustache _ ->
                    True
    in
        [ Form.col [ Col.sm12 ]
            [ Form.group []
                [ Form.label [ for "triggerTemplateType" ] [ text "Payload type" ]
                , Select.select
                    [ Select.id "triggerTemplateType"
                    , Select.onChange UpdateTriggerTemplate
                    ]
                    [ Select.item
                        [ value "notemplate"
                        , selected <| not isMustache
                        ]
                        [ text "Use default event format (JSON)" ]
                    , Select.item
                        [ value "mustache"
                        , selected isMustache
                        ]
                        [ text "Mustache Template" ]
                    ]
                ]
            , renderTemplateBody template
            ]
        ]


renderTemplateBody : Trigger.Template -> Html Msg
renderTemplateBody template =
    case template of
        Trigger.NoTemplate ->
            text ""

        Trigger.Mustache templateBody ->
            Form.group []
                [ Form.label [ for "actionPayload" ] [ text "Payload" ]
                , Textarea.textarea
                    [ Textarea.id "actionPayload"
                    , Textarea.value templateBody
                    , Textarea.onInput UpdateMustachePayload
                    ]
                ]


renderSimpleTrigger : Model -> List (Html Msg)
renderSimpleTrigger model =
    let
        isDataTrigger =
            case model.trigger.simpleTrigger of
                Trigger.Data _ ->
                    True

                Trigger.Device _ ->
                    False
    in
        [ Form.row []
            [ Form.col [ Col.sm12 ]
                [ Form.group []
                    [ Form.label [ for "triggerSimpleTriggerType" ] [ text "Trigger type" ]
                    , Select.select
                        [ Select.id "triggerSimpleTriggerType"
                        , Select.onChange UpdateSimpleTriggerType
                        ]
                        [ Select.item
                            [ value "device"
                            , selected <| not isDataTrigger
                            ]
                            [ text "Device Trigger" ]
                        , Select.item
                            [ value "data"
                            , selected isDataTrigger
                            ]
                            [ text "Data Trigger" ]
                        ]
                    ]
                ]
            ]
        ]
            ++ (case model.trigger.simpleTrigger of
                    Trigger.Data dataTrigger ->
                        renderDataTrigger dataTrigger model

                    Trigger.Device deviceTrigger ->
                        renderDeviceTrigger deviceTrigger
               )


renderDataTrigger : DataTrigger -> Model -> List (Html Msg)
renderDataTrigger dataTrigger model =
    [ Form.row []
        [ Form.col [ Col.sm8 ]
            [ Form.group []
                [ Form.label [ for "triggerInterfaceName" ] [ text "Interface name" ]
                , Select.select
                    [ Select.id "triggerInterfaceName"
                    , Select.onChange UpdateDataTriggerInterfaceName
                    , case model.refInterface of
                        Nothing ->
                            Select.danger

                        Just _ ->
                            Select.success
                    ]
                    (List.map (interfacesOption dataTrigger.interfaceName) model.interfaces)
                ]
            ]
        , Form.col [ Col.sm4 ]
            [ Form.group []
                [ Form.label [ for "triggerInterfaceMajor" ] [ text "Interface major" ]
                , Select.select
                    [ Select.id "triggerInterfaceMajor"
                    , Select.onChange UpdateDataTriggerInterfaceMajor
                    , case model.refInterface of
                        Nothing ->
                            Select.danger

                        Just _ ->
                            Select.success
                    ]
                    (List.map (interfaceMajors dataTrigger.interfaceMajor) model.majors)
                ]
            ]
        ]
    , Form.row []
        [ Form.col [ Col.sm12 ]
            [ Form.group []
                [ Form.label [ for "triggerCondition" ] [ text "Trigger condition" ]
                , Select.select
                    [ Select.id "triggerCondition"
                    , Select.onChange UpdateDataTriggerCondition
                    ]
                    (List.map
                        (dataTriggerEventOptions dataTrigger.on)
                        [ ( DataTrigger.IncomingData, "Incoming Data" )
                        , ( DataTrigger.ValueChange, "Value Change" )
                        , ( DataTrigger.ValueChangeApplied, "Value Change Applied" )
                        , ( DataTrigger.PathCreated, "Path Created" )
                        , ( DataTrigger.PathRemoved, "Path Removed" )
                        , ( DataTrigger.ValueStored, "Value Stored" )
                        ]
                    )
                ]
            ]
        ]
    , Form.row []
        [ Form.col [ Col.sm12 ]
            [ Form.group []
                [ Form.label [ for "triggerPath" ] [ text "Path" ]
                , Input.text
                    [ Input.id "triggerPath"
                    , Input.value dataTrigger.path
                    , Input.onInput UpdateDataTriggerPath
                    , case model.mappingType of
                        Nothing ->
                            Input.danger

                        Just _ ->
                            Input.success
                    ]
                ]
            ]
        ]
    , Form.row []
        [ Form.col [ Col.sm4 ]
            [ Form.group []
                [ Form.label [ for "triggerOperator" ] [ text "Operator" ]
                , Select.select
                    [ Select.id "triggerCondition"
                    , Select.onChange UpdateDataTriggerOperator
                    ]
                    (renderAvailableOperators model.selectedOperator model.mappingType)
                ]
            ]
        , Form.col [ Col.sm8 ]
            [ case model.selectedOperator of
                "any" ->
                    text ""

                _ ->
                    Form.group []
                        [ Form.label [ for "triggerKnownValue" ] [ text "Value" ]
                        , Input.text
                            [ Input.id "triggerKnownValue"
                            , Input.value (model.selectedKnownValue |> Maybe.withDefault "")
                            , Input.onInput UpdateDataTriggerKnownValue
                            , if isValidKnownValue model.mappingType model.selectedKnownValue then
                                Input.success
                              else
                                Input.danger
                            ]
                        ]
            ]
        ]
    ]


isValidKnownValue : Maybe InterfaceMapping.MappingType -> Maybe String -> Bool
isValidKnownValue maybeType maybeValue =
    case ( maybeType, maybeValue ) of
        ( Just mType, Just value ) ->
            InterfaceMapping.isValidType mType value

        _ ->
            False


renderAvailableOperators : String -> Maybe InterfaceMapping.MappingType -> List (Select.Item Msg)
renderAvailableOperators selectedOperator mappingType =
    aviableOperators mappingType
        |> List.map
            (\( id, txt ) ->
                Select.item
                    [ value id
                    , selected <| id == selectedOperator
                    ]
                    [ text txt ]
            )


renderDeviceTrigger : DeviceTrigger -> List (Html Msg)
renderDeviceTrigger deviceTrigger =
    [ Form.row []
        [ Form.col [ Col.sm12 ]
            [ Form.group []
                [ Form.label [ for "triggerDeviceId" ] [ text "Device id" ]
                , Input.text
                    [ Input.id "triggerDeviceId"
                    , Input.value deviceTrigger.deviceId
                    , Input.onInput UpdateDeviceTriggerId
                    ]
                ]
            ]
        ]
    , Form.row []
        [ Form.col [ Col.sm12 ]
            [ Form.group []
                [ Form.label [ for "triggerDeviceOn" ] [ text "Trigger condition" ]
                , Select.select
                    [ Select.id "triggerDeviceOn"
                    , Select.onChange UpdateDeviceTriggerCondition
                    ]
                    (List.map
                        (deviceTriggerEventOptions deviceTrigger.on)
                        [ ( DeviceTrigger.DeviceConnected, "Device Connected" )
                        , ( DeviceTrigger.DeviceDisconnected, "Device Disconnected" )
                        , ( DeviceTrigger.DeviceError, "Device Error" )
                        , ( DeviceTrigger.EmptyCacheReceived, "Empty Cache Received" )
                        ]
                    )
                ]
            ]
        ]
    ]


aviableOperators : Maybe InterfaceMapping.MappingType -> List ( String, String )
aviableOperators mType =
    case mType of
        Nothing ->
            defaultOperators

        Just (Single InterfaceMapping.StringMapping) ->
            allOperators

        Just (Single InterfaceMapping.BinaryBlobMapping) ->
            allOperators

        Just (Single _) ->
            numericOperators

        Just (Array _) ->
            allOperators


defaultOperators : List ( String, String )
defaultOperators =
    [ ( "any", "*" ) ]


numericOperators : List ( String, String )
numericOperators =
    [ ( "any", "*" )
    , ( "equalTo", "==" )
    , ( "notEqualTo", "!=" )
    , ( "greaterThan", ">" )
    , ( "greaterOrEqualTo", ">=" )
    , ( "lessThan", "<" )
    , ( "lessOrEqualTo", "<=" )
    ]


allOperators : List ( String, String )
allOperators =
    [ ( "any", "*" )
    , ( "equalTo", "==" )
    , ( "notEqualTo", "!=" )
    , ( "greaterThan", ">" )
    , ( "greaterOrEqualTo", ">=" )
    , ( "lessThan", "<" )
    , ( "lessOrEqualTo", ">=" )
    , ( "contains", "Contains" )
    , ( "notContains", "Not Contains" )
    ]


decoupleOperator : DataTrigger.Operator -> ( String, Maybe String )
decoupleOperator operator =
    case operator of
        DataTrigger.Any ->
            ( "any", Nothing )

        DataTrigger.EqualTo value ->
            ( "equalTo", Just value )

        DataTrigger.NotEqualTo value ->
            ( "notEqualTo", Just value )

        DataTrigger.GreaterThan value ->
            ( "greaterThan", Just value )

        DataTrigger.GreaterOrEqualTo value ->
            ( "greaterOrEqualTo", Just value )

        DataTrigger.LessThan value ->
            ( "lessThan", Just value )

        DataTrigger.LessOrEqualTo value ->
            ( "lessOrEqualTo", Just value )

        DataTrigger.Contains value ->
            ( "contains", Just value )

        DataTrigger.NotContains value ->
            ( "notContains", Just value )


stringsToOperator : String -> Maybe String -> Result String DataTrigger.Operator
stringsToOperator htmlId knownValue =
    case ( htmlId, knownValue ) of
        ( "any", _ ) ->
            Ok <| DataTrigger.Any

        ( "equalTo", Just value ) ->
            Ok <| DataTrigger.EqualTo value

        ( "notEqualTo", Just value ) ->
            Ok <| DataTrigger.NotEqualTo value

        ( "greaterThan", Just value ) ->
            Ok <| DataTrigger.GreaterThan value

        ( "greaterOrEqualTo", Just value ) ->
            Ok <| DataTrigger.GreaterOrEqualTo value

        ( "lessThan", Just value ) ->
            Ok <| DataTrigger.LessThan value

        ( "lessOrEqualTo", Just value ) ->
            Ok <| DataTrigger.LessOrEqualTo value

        ( "contains", Just value ) ->
            Ok <| DataTrigger.Contains value

        ( "notContains", Just value ) ->
            Ok <| DataTrigger.NotContains value

        ( _, Nothing ) ->
            Err "Known value required"

        ( _, _ ) ->
            Err <| "unknown operator " ++ htmlId


interfacesOption : String -> String -> Select.Item Msg
interfacesOption selectedInterface interfaceName =
    renderOption
        interfaceName
        (selectedInterface == interfaceName)
        interfaceName


interfaceMajors : Int -> Int -> Select.Item Msg
interfaceMajors selectedMajor major =
    renderOption
        (toString major)
        (selectedMajor == major)
        (toString major)


dataTriggerEventOptions : DataTriggerEvent -> ( DataTriggerEvent, String ) -> Select.Item Msg
dataTriggerEventOptions selectedEvent ( dataEvent, label ) =
    renderOption
        (DataTrigger.dataTriggerEventToString dataEvent)
        (dataEvent == selectedEvent)
        label


deviceTriggerEventOptions : DeviceTriggerEvent -> ( DeviceTriggerEvent, String ) -> Select.Item Msg
deviceTriggerEventOptions selectedEvent ( deviceEvent, label ) =
    renderOption
        (DeviceTrigger.deviceTriggerEventToString deviceEvent)
        (deviceEvent == selectedEvent)
        label


renderOption : String -> Bool -> String -> Select.Item Msg
renderOption optionValue isSelected optionLabel =
    Select.item
        [ value optionValue
        , selected isSelected
        ]
        [ text optionLabel ]
