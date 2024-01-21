const NotOwnerNftButtons = ({ state, send }: { send: any; state: any }) => {
  if (!state.matches("isNotOwner.nft")) {
    return null
  }
  return null
}

export default NotOwnerNftButtons
