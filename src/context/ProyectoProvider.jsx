import { useState, useEffect, createContext } from 'react'
import clienteAxios from '../config/clienteAxios'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { io } from "socket.io-client";

let socket

const ProyectoContext = createContext()

const ProyectosProvider = ({ children }) => {
    const [proyectos, setProyectos] = useState([])
    const [alerta, setAlerta] = useState({})
    const [proyecto, setProyecto] = useState({})
    const [cargando, setCargando] = useState(false)
    const [modalFormularioTarea, setModalFormularioTarea] = useState(false)
    const [modalEliminarTarea, setModalEliminarTarea] = useState(false)
    const [tarea, setTarea] = useState({})
    const [colaborador, setColaborador] = useState({})
    const [modalEliminarColaborador, setModalEliminarColaborador] = useState(false)
    const [buscador, setBuscador] = useState(false)

    const navigate = useNavigate()
    const { auth } = useAuth()

    useEffect(() => {
        const obtenerProyectos = async () => {
            setCargando(true)
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                const config = {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                }

                const { data } = await clienteAxios('/proyectos', config)
                setProyectos(data)

            } catch (error) {

            } finally {
                setCargando(false)
            }
        }
        obtenerProyectos()
    }, [auth])

    useEffect(() => {
        socket = io(import.meta.env.VITE_BACKEND_URL)
    }, [])

    const mostrarAlerta = alerta => {
        setAlerta(alerta)
        setTimeout(() => {
            setAlerta('')
        }, 5000)
    }

    const submitProyecto = async proyecto => {
        if (proyecto.id) {
            await editarProyecto(proyecto)
        } else {
            await nuevoProyecto(proyecto)
        }
    }

    const editarProyecto = async proyecto => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
            const { data } = await clienteAxios.put(`/proyectos/${proyecto.id}`, proyecto, config)
            const proyectosActualizados = proyectos.map(proyectoState => proyectoState._id === data._id ? data : proyectoState)
            setProyectos(proyectosActualizados)
            setAlerta({
                msg: 'Proyecto Actualizado correctamente',
                error: false
            })
            setTimeout(() => {
                setAlerta({})
                navigate('/proyectos')
            }, 3000);
        } catch (error) {
        }
    }
    const nuevoProyecto = async proyecto => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
            const { data } = await clienteAxios.post('/proyectos', proyecto, config)
            setProyectos([...proyectos, data])
            setAlerta({
                msg: 'Proyecto Creado correctamente',
                error: false
            })
            setTimeout(() => {
                setAlerta({})
                navigate('/proyectos')
            }, 3000);
        } catch (error) {
        }
    }

    const obtenerProyecto = async id => {
        setCargando(true)
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
            const { data } = await clienteAxios(`/proyectos/${id}`, config)
            setProyecto(data)
            setCargando(false)

        } catch (error) {
            navigate('/proyectos')
            setAlerta({
                msg: error.response.msg,
                error: true
            })
            setTimeout(() => {
                setAlerta({})
            }, 3000);
        }
    }

    const eliminarProyecto = async id => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const { data } = await clienteAxios.delete(`/proyectos/${id}`, config)

            const proyectosActualizados = proyectos.filter(proyectoState => proyectoState._id !== id)
            setProyectos(proyectosActualizados)

            setAlerta({
                msg: data.msg,
                error: false
            })
            setTimeout(() => {
                setAlerta({})
                navigate('/proyectos')
            }, 5000)
        } catch (error) {
            console.log(error)
        }
    }

    const handleModalTarea = () => {
        setModalFormularioTarea(!modalFormularioTarea)
        setTarea({})
    }

    const submitTarea = async tarea => {
        if (tarea?.id) {
            await editarTarea(tarea)
        } else {
            await crearTarea(tarea)
        }
    }

    const handleModalEditarTarea = tarea => {
        console.log(tarea)
        setTarea(tarea)
        setModalFormularioTarea(true)
    }

    const crearTarea = async tarea => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
            const { data } = await clienteAxios.post('/tareas', tarea, config)


            setAlerta({})
            setModalFormularioTarea(false)

            //SOCKET IO
            socket.emit('nueva tarea', data)

        } catch (error) {
            console.log(error)
        }
    }

    const editarTarea = async tarea => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
            const { data } = await clienteAxios.put(`/tareas/${tarea.id}`, tarea, config)


            setAlerta({})
            setModalFormularioTarea(false)

            //Socket
            socket.emit('actualizar tarea', data)
        } catch (error) {

        }
    }

    const handleModalEliminarTarea = tarea => {
        setTarea(tarea)
        setModalEliminarTarea(!modalEliminarTarea)
    }

    const eliminarTarea = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
            const { data } = await clienteAxios.delete(`/tareas/${tarea._id}`, config)
            setAlerta({
                msg: data.msg,
                error: false
            })

            setModalEliminarTarea(false)
            //Socket
            socket.emit('eliminar tarea', tarea)
            setTarea({})
            setTimeout(() => {
                setAlerta({})
            }, 3000);

        } catch (error) {

        }
    }

    const submitColaborador = async email => {
        setCargando(true)
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
            const { data } = await clienteAxios.post(`/proyectos/colaboradores`, { email }, config)
            console.log(data)
            setColaborador(data)
            setAlerta({})
        } catch (error) {
            console.log(error.response)
            setAlerta({
                msg: error.response.data.msg,
                error: true
            })
        } finally {
            setCargando(false)
        }
    }

    const agregarColaborador = async email => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
            const { data } = await clienteAxios.post(`/proyectos/colaboradores/${proyecto._id}`, email, config)
            setAlerta({
                msg: data.msg,
                error: false
            })
            setColaborador({})
            setTimeout(() => {
                setAlerta({})
            }, 3000);
        } catch (error) {
            setAlerta({
                msg: error.response.data.msg,
                error: true
            })
            console.log(error.response)
        }
    }

    const handleModalEliminarColaborador = colaborador => {
        setColaborador(colaborador)
        setModalEliminarColaborador(!modalEliminarColaborador)
    }

    const eliminarColaborador = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
            const { data } = await clienteAxios.post(`/proyectos/eliminar-colaboradores/${proyecto._id}`, { id: colaborador._id }, config)

            const proyectoActualizado = { ...proyecto }
            proyectoActualizado.colaboradores = proyectoActualizado.colaboradores.filter
                (colaboradorState => colaboradorState._id !== colaborador._id)

            setProyecto(proyectoActualizado)
            setModalEliminarColaborador(false)

            setAlerta({
                msg: data.msg,
                error: false
            })
            setColaborador({})
            setTimeout(() => {
                setAlerta({})
            }, 3000);
        } catch (error) {
            console.log(error.response)
        }
    }

    const completarTarea = async id => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
            const { data } = await clienteAxios.post(`/tareas/estado/${id}`, {}, config)

            setTarea({})
            setAlerta({})

            //Socket 
            socket.emit('cambiar estado', data)
        } catch (error) {
            console.log(error)
        }
    }

    const handleBuscador = () => {
        setBuscador(!buscador)
    }

    //Socket io
    const submitTareasProyectos = (tarea) => {
        const proyectoActualizado = { ...proyecto }
        proyectoActualizado.tareas = [...proyectoActualizado.tareas, tarea]
        setProyecto(proyectoActualizado)
    }

    const eliminarTareaProyecto = tarea => {
        const proyectoActualizado = { ...proyecto }
        proyectoActualizado.tareas = proyectoActualizado.tareas.filter(tareasState => tareasState._id !== tarea._id)
        setProyecto(proyectoActualizado)
    }

    const actualizarTareaProyecto = tarea => {
        const proyectoActualizado = { ...proyecto }
        proyectoActualizado.tareas = proyectoActualizado.tareas.map(tareaState =>
            tareaState._id === tarea._id ? tarea : tareaState
        )
        setProyecto(proyectoActualizado)
    }

    const cambiarEstadoTarea = tarea => {
        const proyectoActualizado = { ...proyecto }
        proyectoActualizado.tareas = proyectoActualizado.tareas.map( tareaState => 
            tareaState._id === tarea._id ? tarea : tareaState
        )
        setProyecto(proyectoActualizado)
    }

    const cerrarSesionProyectos = () => {
        setProyectos([])
        setProyecto({})
        setAlerta({})
    }

    return (
        <ProyectoContext.Provider
            value={{
                alerta,
                proyectos,
                mostrarAlerta,
                submitProyecto,
                obtenerProyecto,
                proyecto,
                cargando,
                eliminarProyecto,
                setModalFormularioTarea,
                modalFormularioTarea,
                handleModalTarea,
                submitTarea,
                handleModalEditarTarea,
                tarea,
                handleModalEliminarTarea,
                modalEliminarTarea,
                eliminarTarea,
                submitColaborador,
                colaborador,
                agregarColaborador,
                handleModalEliminarColaborador,
                modalEliminarColaborador,
                eliminarColaborador,
                completarTarea,
                handleBuscador,
                buscador,
                submitTareasProyectos,
                eliminarTareaProyecto,
                actualizarTareaProyecto,
                cambiarEstadoTarea,
                cerrarSesionProyectos
            }}
        >{children}
        </ProyectoContext.Provider>
    )
}

export {
    ProyectosProvider
}

export default ProyectoContext