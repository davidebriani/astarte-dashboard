{-
   This file is part of Astarte.

   Copyright 2020 Ispirata Srl

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
-}


module Page.ReactInit exposing (init, view)

import Html exposing (Html)
import Html.Attributes
import Json.Encode
import Ports
import Route exposing (Route)
import Types.FlashMessage as FlashMessage exposing (FlashMessage)
import Types.Session exposing (Session)


init : Session -> String -> Route -> Cmd ()
init session pageName pageUrl =
    Ports.loadReactPage
        { name = pageName
        , url = Route.toString <| pageUrl
        , opts = Json.Encode.null
        }


view : List FlashMessage -> Html ()
view _ =
    Html.div [ Html.Attributes.id "inner-page" ] []
