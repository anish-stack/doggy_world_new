const TopSearchesModel = require("../../models/Top Searches/TopSearchesModel");

const CACHE_KEY = 'searches:all';

// CREATE
exports.createSearch = async (req, res) => {
    const redis = req.app.get('redis');
    try {
        const { searchTerm, position, route, id } = req.body;

        const existing = await TopSearchesModel.findOne({ position });
        if (existing) {
            return res.status(400).json({ message: `Position ${position} is already taken.` });
        }

        const newSearch = new TopSearchesModel({ searchTerm, position, route, id });
        await newSearch.save();
        await redis.del(CACHE_KEY);

        return res.status(201).json({ message: "Top search created successfully.", data: newSearch });
    } catch (error) {
        await redis.del(CACHE_KEY);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// READ (with Redis cache)
exports.getAllSearches = async (req, res) => {
    const redis = req.app.get('redis');
    try {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
            return res.status(200).json({ data: JSON.parse(cached), fromCache: true });
        }

        const searches = await TopSearchesModel.find().sort({ position: 1 });
        await redis.set(CACHE_KEY, JSON.stringify(searches));

        return res.status(200).json({ data: searches });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch", error: error.message });
    }
};

// UPDATE
exports.updateSearch = async (req, res) => {
    const redis = req.app.get('redis');
    try {
        const { id: _id } = req.params;
        const { searchTerm, position, route, id } = req.body;

        const existing = await TopSearchesModel.findOne({ position, _id: { $ne: _id } });
        if (existing) {
            return res.status(400).json({ message: `Position ${position} is already assigned.` });
        }

        const updated = await TopSearchesModel.findByIdAndUpdate(
            _id,
            { searchTerm, position, route, id},
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Search not found." });
        }

        await redis.del(CACHE_KEY);

        return res.status(200).json({ message: "Updated successfully", data: updated });
    } catch (error) {
        await redis.del(CACHE_KEY);
        return res.status(500).json({ message: "Update failed", error: error.message });
    }
};

// DELETE
exports.deleteSearch = async (req, res) => {
    const redis = req.app.get('redis');
    try {
        const { id } = req.params;
        const deleted = await TopSearchesModel.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ message: "Search not found." });
        }

        await redis.del(CACHE_KEY);
        return res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Delete failed", error: error.message });
    }
};

// TOGGLE STATUS
exports.toggleStatus = async (req, res) => {
    const redis = req.app.get('redis');
    try {
        const { id } = req.params;

        const search = await TopSearchesModel.findById(id);
        if (!search) {
            return res.status(404).json({ message: "Search not found." });
        }

        search.active = !search.active;
        await search.save();
        await redis.del(CACHE_KEY);

        return res.status(200).json({
            message: `Status changed to ${search.active ? 'active' : 'inactive'}`,
            data: search
        });
    } catch (error) {
        return res.status(500).json({ message: "Status update failed", error: error.message });
    }
};
