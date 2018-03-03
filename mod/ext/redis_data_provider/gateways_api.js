/**
 * @author Pedro Sanders
 * @since v1
 */
import DataSource from 'ext/redis_data_provider/ds'
import DSUtil from 'data_provider/utils'
import { Status } from 'data_provider/status'
import isEmpty from 'utils/obj_util'

export default class GatewaysAPI {

    constructor() {
        this.ds = new DataSource()
    }

    createFromJSON(jsonObj) {
        try {
            if(this.gatewayExist(jsonObj.spec.regService.host)) {
                return {
                    status: Status.CONFLICT,
                    message: Status.message[Status.CONFLICT].value,
                }
            }

            return this.ds.insert(jsonObj)
        } catch(e) {
            return {
                status: Status.BAD_REQUEST,
                message: Status.message[Status.BAD_REQUEST].value,
                result: e.getMessage()
            }
        }
    }

    updateFromJSON(jsonObj) {
        try {
            if(!this.gatewayExist(jsonObj.spec.regService.host)) {
                return {
                    status: Status.CONFLICT,
                    message: Status.message[Status.CONFLICT].value,
                }
            }

            return this.ds.update(jsonObj)
        } catch(e) {
            return {
                status: Status.BAD_REQUEST,
                message: Status.message[Status.BAD_REQUEST].value,
                result: e.getMessage()
            }
        }
    }

    getGateways(filter)  {
        return this.ds.withCollection('gateways').find(filter)
    }

    getGateway(ref) {
        const response = this.getGateways()
        let gateways

        response.result.forEach(obj => {
            if (obj.metadata.ref == ref) {
                gateways = obj
            }
        })

        if (!isEmpty(gateways)) {
            return {
                status: Status.OK,
                message: Status.message[Status.OK].value,
                result: gateways
            }
        }

        return {
            status: Status.NOT_FOUND,
            message: Status.message[Status.NOT_FOUND].value
        }
    }

    getGatewayByHost(host) {
        const response = this.getGateways()
        let gateways

        response.result.forEach(obj => {
            if (obj.spec.regService.host == host) {
                gateways = obj
            }
        })

        if (!isEmpty(gateways)) {
            return {
                status: Status.OK,
                message: Status.message[Status.OK].value,
                result: gateways
            }
        }

        return {
            status: Status.NOT_FOUND,
            message: Status.message[Status.NOT_FOUND].value
        }
    }

    gatewayExist(host) {
        const response = this.getGatewayByHost(host)
        if (response.status == Status.OK) return true
        return false
    }

    deleteGateway(ref) {
        try {
            let response = this.getGateway(ref)

            if (response.status != Status.OK) {
                return response
            }

            const gateway = response.result

            response = this.ds.withCollection('dids').find("@.metadata.gwRef == '" + gateway.metadata.ref + "'")
            const dids = response.result

            if (dids.length == 0) {
                return this.ds.withCollection('gateways').remove(ref)
            } else {
                return {
                    status: Status.BAD_REQUEST,
                    message: Status.message[Status.BAD_REQUEST].value,
                    result: 'Must first remove all dids in this gateway'
                }
            }
        } catch(e) {
            return {
                status: Status.BAD_REQUEST,
                message: Status.message[Status.BAD_REQUEST].value,
                result: e.getMessage()
            }
        }
    }

}